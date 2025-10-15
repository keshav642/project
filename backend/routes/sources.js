import express from "express";
import pool from "../db.js";

const router = express.Router();

// ============================================
// GET ALL SOURCES
// ============================================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM lead_sources ORDER BY name ASC"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching sources:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET SINGLE SOURCE
// ============================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM lead_sources WHERE id = $1",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Source not found" });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error fetching source:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADD NEW SOURCE
// ============================================
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: "Source name is required" 
      });
    }
    
    // Check if source with same name already exists
    const existingSource = await pool.query(
      "SELECT * FROM lead_sources WHERE LOWER(name) = LOWER($1)",
      [name.trim()]
    );
    
    if (existingSource.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: "A source with this name already exists" 
      });
    }
    
    const result = await pool.query(
      "INSERT INTO lead_sources (name, description) VALUES ($1, $2) RETURNING *",
      [name.trim(), description?.trim() || null]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error adding source:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// UPDATE SOURCE
// ============================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: "Source name is required" 
      });
    }
    
    // Check if another source with same name exists
    const existingSource = await pool.query(
      "SELECT * FROM lead_sources WHERE LOWER(name) = LOWER($1) AND id != $2",
      [name.trim(), id]
    );
    
    if (existingSource.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: "A source with this name already exists" 
      });
    }
    
    const result = await pool.query(
      "UPDATE lead_sources SET name = $1, description = $2 WHERE id = $3 RETURNING *",
      [name.trim(), description?.trim() || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Source not found" });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error updating source:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DELETE SOURCE
// ============================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if any employees using this source
    const employeesCheck = await pool.query(
      "SELECT COUNT(*) FROM employees WHERE source_id = $1",
      [id]
    );
    
    const employeeCount = parseInt(employeesCheck.rows[0].count);
    
    if (employeeCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete. ${employeeCount} lead${employeeCount > 1 ? 's are' : ' is'} using this source. Remove source from leads first.` 
      });
    }
    
    // Delete source
    const result = await pool.query(
      "DELETE FROM lead_sources WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Source not found" });
    }
    
    res.json({ 
      success: true, 
      message: "Source deleted successfully",
      deleted: result.rows[0]
    });
  } catch (error) {
    console.error("Error deleting source:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET SOURCE STATISTICS
// ============================================
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    
    const stats = await pool.query(`
      SELECT 
        ls.name as source_name,
        COUNT(e.email) as total_leads,
        COUNT(DISTINCT cl.campaign_id) as campaigns_count
      FROM lead_sources ls
      LEFT JOIN employees e ON e.source_id = ls.id
      LEFT JOIN campaign_leads cl ON cl.lead_email = e.email
      WHERE ls.id = $1
      GROUP BY ls.id, ls.name
    `, [id]);
    
    if (stats.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Source not found" });
    }
    
    res.json({ success: true, data: stats.rows[0] });
  } catch (error) {
    console.error("Error fetching source stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;