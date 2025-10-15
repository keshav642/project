import express from "express";
import multer from "multer";
import Papa from "papaparse";
import pool from "../db.js";
import fs from "fs";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

// Upload CSV and import leads
router.post("/csv", upload.single("file"), async (req, res) => {
  try {
    const { source_id } = req.body;
    const fileContent = fs.readFileSync(req.file.path, "utf8");
    
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    
    let imported = 0;
    
    for (const row of parsed.data) {
      if (row.email) {
        await pool.query(
          `INSERT INTO employees (name, email, designation, source_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name, designation = EXCLUDED.designation, source_id = EXCLUDED.source_id`,
          [row.name, row.email, row.designation, source_id]
        );
        imported++;
      }
    }
    
    fs.unlinkSync(req.file.path); // Delete uploaded file
    
    res.json({ success: true, imported: imported });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;