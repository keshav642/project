import express from "express";
import { google } from "googleapis";
import pool from "../db.js";
import Papa from "papaparse";

const router = express.Router();

// ============ GOOGLE DRIVE FILE OPERATIONS ============

// List all Google Docs/Files
router.get("/list/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const tokenResult = await pool.query(
      "SELECT access_token FROM google_tokens WHERE user_id = $1",
      [userId]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: "Google not connected" });
    }
    
    const accessToken = tokenResult.rows[0].access_token;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.document' or mimeType='text/csv'",
      fields: 'files(id, name, createdTime, modifiedTime, mimeType)',
      pageSize: 20
    });
    
    res.json({
      documents: response.data.files
    });
  } catch (error) {
    console.error("Error listing documents:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific Google Doc content
router.get("/document/:documentId/:userId", async (req, res) => {
  try {
    const { documentId, userId } = req.params;
    
    const tokenResult = await pool.query(
      "SELECT access_token FROM google_tokens WHERE user_id = $1",
      [userId]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: "Google not connected" });
    }
    
    const accessToken = tokenResult.rows[0].access_token;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    
    const document = await docs.documents.get({
      documentId: documentId
    });
    
    res.json({
      title: document.data.title,
      content: document.data.body.content
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============ SYNC GOOGLE DRIVE TO DATABASE ============

// Sync Google Drive CSV to PostgreSQL employees table
router.post("/sync-to-database/:fileId/:userId", async (req, res) => {
  try {
    const { fileId, userId } = req.params;
    
    // Get Google token
    const tokenResult = await pool.query(
      "SELECT access_token FROM google_tokens WHERE user_id = $1",
      [userId]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: "Google not connected" });
    }
    
    const accessToken = tokenResult.rows[0].access_token;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Fetch CSV from Drive
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'text' });
    
    // Parse CSV
    const parsed = Papa.parse(response.data, { 
      header: true, 
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    // Insert into employees table
    for (const row of parsed.data) {
      try {
        if (!row.email) {
          errorCount++;
          continue;
        }
        
        const result = await pool.query(
          `INSERT INTO employees (name, email, designation)
           VALUES ($1, $2, $3)
           ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name, 
               designation = EXCLUDED.designation
           RETURNING (xmax = 0) AS inserted`,
          [row.name || '', row.email, row.designation || '']
        );
        
        if (result.rows[0].inserted) {
          insertedCount++;
        } else {
          updatedCount++;
        }
      } catch (err) {
        console.error("Error inserting row:", err);
        errorCount++;
      }
    }
    
    res.json({ 
      success: true,
      message: "Data synced successfully from Google Drive",
      inserted: insertedCount,
      updated: updatedCount,
      errors: errorCount,
      total: parsed.data.length
    });
    
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============ EMPLOYEES DATA ROUTES (FROM DATABASE) ============

// Get ALL employees from database (no Google Drive call)
router.get("/employees", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT name, email, designation FROM employees ORDER BY name ASC"
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get employees with pagination and search
router.get("/employees/paginated", async (req, res) => {
  try {
    const { page = 1, limit = 50, search = "", designation = "" } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT name, email, designation 
      FROM employees
      WHERE 1=1
    `;
    
    let countQuery = `SELECT COUNT(*) FROM employees WHERE 1=1`;
    let params = [];
    
    // Search functionality
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
      countQuery += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    
    // Designation filter
    if (designation) {
      params.push(`%${designation}%`);
      query += ` AND designation ILIKE $${params.length}`;
      countQuery += ` AND designation ILIKE $${params.length}`;
    }
    
    query += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const [employees, total] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search || designation ? params.slice(0, -2) : [])
    ]);
    
    const totalEmployees = parseInt(total.rows[0].count);
    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    
    res.json({
      success: true,
      data: employees.rows,
      pagination: {
        currentPage: currentPage,
        limit: pageLimit,
        total: totalEmployees,
        totalPages: Math.ceil(totalEmployees / pageLimit),
        hasNextPage: currentPage < Math.ceil(totalEmployees / pageLimit),
        hasPrevPage: currentPage > 1
      }
    });
    
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get single employee by email
router.get("/employee/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    const result = await pool.query(
      "SELECT name, email, designation FROM employees WHERE email = $1",
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============ LEGACY ROUTE (kept for backward compatibility) ============

// Get CSV file from Google Drive (direct fetch - use sparingly)
router.get("/file/:fileId/:userId", async (req, res) => {
  try {
    const { fileId, userId } = req.params;
    
    const tokenResult = await pool.query(
      "SELECT access_token FROM google_tokens WHERE user_id = $1",
      [userId]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: "Google not connected" });
    }
    
    const accessToken = tokenResult.rows[0].access_token;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'text' });
    
    res.send(response.data);
    
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;