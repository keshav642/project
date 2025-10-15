import express from "express";
import pool from "../db.js";

const router = express.Router();

// Get all leads with filters
router.get("/", async (req, res) => {
  try {
    const { designation, search } = req.query;
    let query = "SELECT name, email, designation FROM employees WHERE 1=1";
    const params = [];
    
    if (designation) {
      params.push(designation);
      query += ` AND designation ILIKE $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      const searchIdx = params.length;
      query += ` AND (name ILIKE $${searchIdx} OR email ILIKE $${searchIdx})`;
    }
    
    query += " ORDER BY name ASC";
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all unique designations
router.get("/designations", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT designation FROM employees WHERE designation IS NOT NULL ORDER BY designation"
    );
    res.json({ success: true, data: result.rows.map(r => r.designation) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// OLD: MailerSend Email Sending (DEPRECATED)
// Now using /api/automation/send-now instead
// Keeping this for backup/reference only
// ============================================

/*
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import { v4 as uuidv4 } from "uuid";

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const emailCounts = new Map();

setInterval(() => {
  emailCounts.clear();
}, 24 * 60 * 60 * 1000);

const emailTemplates = {
  'CISO': {
    subject: 'VectorEdge - Critical Security Solutions for CISOs',
    body: (name) => `<div style="font-family: Arial, sans-serif;"><h2>Hi ${name},</h2><p>As a CISO, you face unique security challenges.</p><p>Best regards,<br>VectorEdge Team</p></div>`
  },
  'Chief Information Security Officer': {
    subject: 'VectorEdge - Enterprise Security Excellence',
    body: (name) => `<div style="font-family: Arial, sans-serif;"><h2>Dear ${name},</h2><p>Transform your enterprise security with VectorEdge.</p><p>Best regards,<br>VectorEdge Team</p></div>`
  },
  'CIO': {
    subject: 'VectorEdge - IT Innovation & Digital Transformation',
    body: (name) => `<div style="font-family: Arial, sans-serif;"><h2>Hi ${name},</h2><p>Drive digital transformation with VectorEdge.</p><p>Best regards,<br>VectorEdge Team</p></div>`
  },
  'default': {
    subject: 'VectorEdge - Professional Opportunities',
    body: (name) => `<div style="font-family: Arial, sans-serif;"><h2>Hi ${name},</h2><p>We have exciting opportunities for you.</p><p>Best regards,<br>VectorEdge Team</p></div>`
  }
};

router.get("/email-limit", async (req, res) => {
  const today = new Date().toDateString();
  const currentCount = emailCounts.get(today) || 0;
  res.json({ success: true, sent: currentCount, remaining: 100 - currentCount, limit: 100 });
});

router.post("/send-emails", async (req, res) => {
  try {
    const today = new Date().toDateString();
    const currentCount = emailCounts.get(today) || 0;
    const { employees } = req.body;
    
    if (currentCount >= 100) {
      return res.status(429).json({ 
        error: `Daily limit of 100 emails reached.`, 
        sent: currentCount, 
        remaining: 0 
      });
    }
    
    if (currentCount + employees.length > 100) {
      return res.status(429).json({ 
        error: `Cannot send ${employees.length} emails. Only ${100 - currentCount} remaining.`, 
        sent: currentCount, 
        remaining: 100 - currentCount 
      });
    }
    
    const results = [];
    let successCount = 0;
    const sentFrom = new Sender(
      process.env.MAILERSEND_FROM_EMAIL, 
      process.env.MAILERSEND_FROM_NAME
    );
    
    for (const emp of employees) {
      try {
        const trackingId = uuidv4();
        const template = emailTemplates[emp.designation] || emailTemplates.default;
        const recipients = [new Recipient(emp.email, emp.name)];
        
        const emailParams = new EmailParams()
          .setFrom(sentFrom)
          .setTo(recipients)
          .setSubject(template.subject)
          .setHtml(template.body(emp.name) + `<img src="http://localhost:5000/api/leads/track/${trackingId}" width="1" height="1" style="display:none;"/>`);
        
        await mailerSend.email.send(emailParams);
        
        await pool.query(
          "INSERT INTO tracker_table (email, tracking_id, subject, template_type) VALUES ($1, $2, $3, $4)",
          [emp.email, trackingId, template.subject, emp.designation]
        );
        
        results.push({ email: emp.email, status: 'sent' });
        successCount++;
      } catch (err) {
        results.push({ email: emp.email, status: 'failed', error: err.message });
      }
    }
    
    emailCounts.set(today, currentCount + successCount);
    
    res.json({ 
      success: true, 
      results, 
      emailsSent: successCount, 
      emailsFailed: results.filter(r => r.status === 'failed').length, 
      remainingToday: 100 - (currentCount + successCount) 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/track/:trackingId", async (req, res) => {
  try {
    await pool.query(
      `UPDATE tracker_table 
       SET opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP), 
           open_count = open_count + 1, 
           last_opened_at = CURRENT_TIMESTAMP 
       WHERE tracking_id = $1`,
      [req.params.trackingId]
    );
    
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    res.end(pixel);
  } catch (error) {
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.end(pixel);
  }
});

router.get("/tracking-stats", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tracker_table ORDER BY sent_at DESC LIMIT 100"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/

// ============================================
// NOTE: All email sending now handled by:
// /api/automation/send-now (immediate)
// /api/automation/schedule-emails (scheduled)
// ============================================

export default router;