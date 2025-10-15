import express from "express";
import pool from "../db.js";

const router = express.Router();

// ============================================
// GET ALL CAMPAIGNS
// ============================================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT cl.lead_email) as total_leads,
        COUNT(DISTINCT CASE WHEN cl.status = 'sent' THEN cl.lead_email END) as sent_count,
        COUNT(DISTINCT CASE WHEN cl.status = 'pending' THEN cl.lead_email END) as pending_count,
        COUNT(DISTINCT CASE WHEN cl.opened_at IS NOT NULL THEN cl.lead_email END) as opened_count,
        COUNT(DISTINCT CASE WHEN cl.replied_at IS NOT NULL THEN cl.lead_email END) as replied_count
      FROM campaigns c
      LEFT JOIN campaign_leads cl ON c.id = cl.campaign_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET SINGLE CAMPAIGN WITH DETAILS
// ============================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get campaign info
    const campaign = await pool.query(
      "SELECT * FROM campaigns WHERE id = $1",
      [id]
    );
    
    if (campaign.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }
    
    // Get campaign leads with details
    const leads = await pool.query(`
      SELECT 
        cl.*,
        e.name,
        e.designation
      FROM campaign_leads cl
      JOIN employees e ON cl.lead_email = e.email
      WHERE cl.campaign_id = $1
      ORDER BY cl.created_at DESC
    `, [id]);
    
    // Get stats
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened,
        COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicked,
        COUNT(CASE WHEN replied_at IS NOT NULL THEN 1 END) as replied
      FROM campaign_leads
      WHERE campaign_id = $1
    `, [id]);
    
    res.json({
      success: true,
      campaign: campaign.rows[0],
      leads: leads.rows,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error("Error fetching campaign details:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CREATE NEW CAMPAIGN
// ============================================
router.post("/", async (req, res) => {
  try {
    const { name, type, template_key, description, lead_emails } = req.body;
    
    console.log("Creating campaign:", { name, type, template_key, lead_emails: lead_emails?.length });
    
    if (!name || !type) {
      return res.status(400).json({ 
        success: false, 
        error: "Name and type are required" 
      });
    }
    
    // Insert campaign
    const campaign = await pool.query(
      `INSERT INTO campaigns (name, type, template_key, description, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [name, type, template_key || null, description || null]
    );
    
    const campaignId = campaign.rows[0].id;
    console.log("Campaign created with ID:", campaignId);
    
    // Add leads to campaign if provided
    if (lead_emails && Array.isArray(lead_emails) && lead_emails.length > 0) {
      let addedCount = 0;
      
      for (const email of lead_emails) {
        try {
          await pool.query(
            `INSERT INTO campaign_leads (campaign_id, lead_email, status)
             VALUES ($1, $2, 'pending')
             ON CONFLICT (campaign_id, lead_email) DO NOTHING`,
            [campaignId, email]
          );
          addedCount++;
        } catch (err) {
          console.error(`Error adding lead ${email}:`, err.message);
        }
      }
      
      console.log(`Added ${addedCount} leads to campaign`);
    }
    
    res.json({ 
      success: true, 
      data: campaign.rows[0],
      message: `Campaign created with ${lead_emails?.length || 0} leads` 
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// UPDATE CAMPAIGN
// ============================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, template_key, description, status } = req.body;
    
    const result = await pool.query(
      `UPDATE campaigns 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           template_key = COALESCE($3, template_key),
           description = COALESCE($4, description),
           status = COALESCE($5, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, type, template_key, description, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DELETE CAMPAIGN
// ============================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete campaign (CASCADE will delete campaign_leads)
    const result = await pool.query(
      "DELETE FROM campaigns WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }
    
    res.json({ success: true, message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADD LEADS TO CAMPAIGN
// ============================================
router.post("/:id/leads", async (req, res) => {
  try {
    const { id } = req.params;
    const { lead_emails } = req.body;
    
    if (!lead_emails || lead_emails.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "No leads provided" 
      });
    }
    
    let added = 0;
    
    for (const email of lead_emails) {
      const result = await pool.query(
        `INSERT INTO campaign_leads (campaign_id, lead_email, status)
         VALUES ($1, $2, 'pending')
         ON CONFLICT (campaign_id, lead_email) DO NOTHING
         RETURNING *`,
        [id, email]
      );
      
      if (result.rows.length > 0) {
        added++;
      }
    }
    
    res.json({ 
      success: true, 
      message: `${added} leads added to campaign`,
      added: added
    });
  } catch (error) {
    console.error("Error adding leads:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// REMOVE LEAD FROM CAMPAIGN
// ============================================
router.delete("/:id/leads/:email", async (req, res) => {
  try {
    const { id, email } = req.params;
    
    await pool.query(
      "DELETE FROM campaign_leads WHERE campaign_id = $1 AND lead_email = $2",
      [id, email]
    );
    
    res.json({ success: true, message: "Lead removed from campaign" });
  } catch (error) {
    console.error("Error removing lead:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// LAUNCH CAMPAIGN (Activate and schedule emails)
// ============================================
router.post("/:id/launch", async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_time } = req.body;
    
    console.log(`Launching campaign ${id} at ${scheduled_time}`);
    
    // Get campaign details
    const campaign = await pool.query(
      "SELECT * FROM campaigns WHERE id = $1",
      [id]
    );
    
    if (campaign.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }
    
    // Get all pending leads
    const leads = await pool.query(`
      SELECT cl.lead_email, e.name, e.designation
      FROM campaign_leads cl
      JOIN employees e ON cl.lead_email = e.email
      WHERE cl.campaign_id = $1 AND cl.status = 'pending'
    `, [id]);
    
    if (leads.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "No pending leads in campaign" 
      });
    }
    
    // Get template key
    const templateKey = campaign.rows[0].template_key || 'default';
    
    // Import email templates from automation.js
    const automationPath = new URL('./automation.js', import.meta.url);
    const { EMAIL_TEMPLATES } = await import(automationPath);
    
    // Schedule emails for each lead
    let scheduled = 0;
    const scheduleTime = scheduled_time ? new Date(scheduled_time) : new Date();
    
    for (const lead of leads.rows) {
      try {
        // Get appropriate template
        const template = EMAIL_TEMPLATES[templateKey] || EMAIL_TEMPLATES.default;
        const personalizedBody = template.body(lead.name || 'there');
        
        // Insert into scheduled_emails table
        await pool.query(
          `INSERT INTO scheduled_emails 
           (employee_email, employee_name, designation, subject, body, scheduled_time, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [lead.lead_email, lead.name, lead.designation, template.subject, personalizedBody, scheduleTime]
        );
        
        // Update campaign_leads status
        await pool.query(
          `UPDATE campaign_leads 
           SET status = 'scheduled' 
           WHERE campaign_id = $1 AND lead_email = $2`,
          [id, lead.lead_email]
        );
        
        scheduled++;
      } catch (err) {
        console.error(`Error scheduling email for ${lead.lead_email}:`, err.message);
      }
    }
    
    // Update campaign status to active
    await pool.query(
      "UPDATE campaigns SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );
    
    console.log(`Campaign ${id} launched! ${scheduled} emails scheduled.`);
    
    res.json({ 
      success: true, 
      message: `Campaign launched! ${scheduled} emails scheduled for ${new Date(scheduleTime).toLocaleString()}`,
      scheduled: scheduled
    });
  } catch (error) {
    console.error("Error launching campaign:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PAUSE/RESUME CAMPAIGN
// ============================================
router.post("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await pool.query(
      "SELECT status FROM campaigns WHERE id = $1",
      [id]
    );
    
    if (campaign.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }
    
    const currentStatus = campaign.rows[0].status;
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    await pool.query(
      "UPDATE campaigns SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [newStatus, id]
    );
    
    res.json({ 
      success: true, 
      message: `Campaign ${newStatus}`,
      status: newStatus
    });
  } catch (error) {
    console.error("Error toggling campaign:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;