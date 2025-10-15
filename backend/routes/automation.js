import express from "express";
import pool from "../db.js";

const router = express.Router();

// ============ HARDCODED EMAIL TEMPLATES (Easy to Edit!) ============

const EMAIL_TEMPLATES = {
  // Default template for all leads
  default: {
    name: "General Welcome",
    subject: "Welcome to VectorEdge - Transform Your Business Today!",
    body: (name) => `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">VectorEdge</h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Turning Leads into Opportunities</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hi ${name},</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for your interest in <strong>VectorEdge</strong>! We're excited to connect with you.
          </p>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            At VectorEdge, we provide cutting-edge solutions that help modern businesses accelerate growth and achieve measurable results.
          </p>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
            Best regards,<br><strong style="color: #667eea;">The VectorEdge Team</strong>
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 13px; margin: 0; text-align: center;">© 2025 VectorEdge. All rights reserved.</p>
        </div>
      </div>
    `
  },
  
  // CISO - Chief Information Security Officer
  CISO: {
    name: "CISO Security Solutions",
    subject: "VectorEdge - Advanced Cybersecurity Solutions for CISOs",
    body: (name) => `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🔒 VectorEdge Security</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hi ${name},</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            As a <strong>CISO</strong>, you face unique security challenges every day. VectorEdge provides enterprise-grade cybersecurity solutions.
          </p>
          <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>🛡️ Advanced Threat Detection & Response</li>
            <li>🔐 Zero Trust Architecture</li>
            <li>📋 Compliance Management (SOC 2, ISO 27001)</li>
          </ul>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
            Best regards,<br><strong style="color: #667eea;">VectorEdge Security Team</strong>
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 13px; margin: 0; text-align: center;">© 2025 VectorEdge. All rights reserved.</p>
        </div>
      </div>
    `
  },
  
  // CIO - Chief Information Officer
  CIO: {
    name: "CIO Digital Transformation",
    subject: "VectorEdge - Drive Digital Transformation as a CIO",
    body: (name) => `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">💡 VectorEdge Innovation</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hi ${name},</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            As a <strong>CIO</strong>, driving digital transformation is at the heart of what you do.
          </p>
          <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>☁️ Cloud Migration & Optimization</li>
            <li>🤖 AI & Machine Learning Integration</li>
            <li>📱 Legacy System Modernization</li>
          </ul>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
            Best regards,<br><strong style="color: #11998e;">VectorEdge Innovation Team</strong>
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 13px; margin: 0; text-align: center;">© 2025 VectorEdge. All rights reserved.</p>
        </div>
      </div>
    `
  },
  
  // CTO - Chief Technology Officer
  CTO: {
    name: "CTO Technology Leadership",
    subject: "VectorEdge - Technology Solutions for CTOs",
    body: (name) => `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🚀 VectorEdge Tech</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hi ${name},</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            As a <strong>CTO</strong>, you need cutting-edge technology solutions that scale.
          </p>
          <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>⚙️ Microservices Architecture</li>
            <li>🔧 Platform Engineering</li>
            <li>📈 Scalable Infrastructure</li>
          </ul>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
            Best regards,<br><strong style="color: #f5576c;">VectorEdge Tech Team</strong>
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 13px; margin: 0; text-align: center;">© 2025 VectorEdge. All rights reserved.</p>
        </div>
      </div>
    `
  },
  
  // CRO - Chief Risk Officer
  CRO: {
    name: "CRO Risk Management",
    subject: "VectorEdge - Comprehensive Risk Management Solutions",
    body: (name) => `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">📊 VectorEdge Risk</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hi ${name},</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            As a <strong>Chief Risk Officer</strong>, managing enterprise risk is your priority.
          </p>
          <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>📉 Risk Assessment & Mitigation</li>
            <li>🎯 Compliance Monitoring</li>
            <li>🔍 Audit Management</li>
          </ul>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
            Best regards,<br><strong style="color: #fa709a;">VectorEdge Risk Team</strong>
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 13px; margin: 0; text-align: center;">© 2025 VectorEdge. All rights reserved.</p>
        </div>
      </div>
    `
  },
  
  // VP Cybersecurity
  "VP Cybersecurity": {
    name: "VP Cybersecurity Solutions",
    subject: "VectorEdge - Elevate Your Cybersecurity Strategy",
    body: (name) => `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🔐 VectorEdge Cyber</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hi ${name},</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            As <strong>VP of Cybersecurity</strong>, you lead the charge in protecting your organization.
          </p>
          <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>🚨 Incident Response Planning</li>
            <li>🛡️ Security Operations Center (SOC)</li>
            <li>📱 Mobile Security Solutions</li>
          </ul>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
            Best regards,<br><strong style="color: #4facfe;">VectorEdge Cyber Team</strong>
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 13px; margin: 0; text-align: center;">© 2025 VectorEdge. All rights reserved.</p>
        </div>
      </div>
    `
  },
  
  // VP Information Security
  "VP Information Security": {
    name: "VP Information Security",
    subject: "VectorEdge - Strengthen Your Information Security",
    body: (name) => `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: 700;">🔒 VectorEdge InfoSec</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hi ${name},</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            As <strong>VP of Information Security</strong>, data protection is your mission.
          </p>
          <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>📁 Data Loss Prevention (DLP)</li>
            <li>🔑 Identity & Access Management</li>
            <li>🔐 Encryption Solutions</li>
          </ul>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
            Best regards,<br><strong style="color: #667eea;">VectorEdge InfoSec Team</strong>
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 13px; margin: 0; text-align: center;">© 2025 VectorEdge. All rights reserved.</p>
        </div>
      </div>
    `
  },
  
  // Director of IT Security
  "Director of IT Security": {
    name: "Director IT Security",
    subject: "VectorEdge - IT Security Innovation for Directors",
    body: (name) => `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: 700;">🛡️ VectorEdge IT Security</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hi ${name},</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            As <strong>Director of IT Security</strong>, you're modernizing security infrastructure.
          </p>
          <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>🔧 Security Architecture Design</li>
            <li>⚡ Network Security Solutions</li>
            <li>📊 Security Metrics & Reporting</li>
          </ul>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
            Best regards,<br><strong style="color: #ff9a9e;">VectorEdge IT Security Team</strong>
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 13px; margin: 0; text-align: center;">© 2025 VectorEdge. All rights reserved.</p>
        </div>
      </div>
    `
  },
  
  // Director Cybersecurity
  "Director Cybersecurity": {
    name: "Director Cybersecurity",
    subject: "VectorEdge - Advanced Cybersecurity for Directors",
    body: (name) => `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🔐 VectorEdge Cyber Defense</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hi ${name},</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            As <strong>Director of Cybersecurity</strong>, your expertise protects the organization.
          </p>
          <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>🎯 Penetration Testing</li>
            <li>🚨 Security Awareness Training</li>
            <li>📋 Policy Development</li>
          </ul>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
            Best regards,<br><strong style="color: #667eea;">VectorEdge Cyber Defense Team</strong>
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 13px; margin: 0; text-align: center;">© 2025 VectorEdge. All rights reserved.</p>
        </div>
      </div>
    `
  },
  
  // Risk & Compliance Manager
  "Risk & Compliance Manager": {
    name: "Risk & Compliance Manager",
    subject: "VectorEdge - Simplify Risk & Compliance Management",
    body: (name) => `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: 700;">✅ VectorEdge Compliance</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hi ${name},</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            As a <strong>Risk & Compliance Manager</strong>, staying compliant is crucial.
          </p>
          <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>📋 Regulatory Compliance Tools</li>
            <li>🔍 Risk Assessment Automation</li>
            <li>📊 Compliance Reporting</li>
          </ul>
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
            Best regards,<br><strong style="color: #fcb69f;">VectorEdge Compliance Team</strong>
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 13px; margin: 0; text-align: center;">© 2025 VectorEdge. All rights reserved.</p>
        </div>
      </div>
    `
  }
};

// Helper function to get template by designation
function getEmailTemplate(designation) {
  if (EMAIL_TEMPLATES[designation]) {
    return EMAIL_TEMPLATES[designation];
  }
  
  const designationLower = designation?.toLowerCase() || '';
  
  // Fuzzy matching for different designation formats
  if (designationLower.includes('ciso') || designationLower.includes('chief information security')) {
    return EMAIL_TEMPLATES.CISO;
  }
  if (designationLower.includes('cio') || designationLower.includes('chief information officer')) {
    return EMAIL_TEMPLATES.CIO;
  }
  if (designationLower.includes('cto') || designationLower.includes('chief technology')) {
    return EMAIL_TEMPLATES.CTO;
  }
  if (designationLower.includes('cro') || designationLower.includes('chief risk')) {
    return EMAIL_TEMPLATES.CRO;
  }
  if (designationLower.includes('vp') && designationLower.includes('cyber')) {
    return EMAIL_TEMPLATES["VP Cybersecurity"];
  }
  if (designationLower.includes('vp') && designationLower.includes('information security')) {
    return EMAIL_TEMPLATES["VP Information Security"];
  }
  if (designationLower.includes('director') && (designationLower.includes('it security') || designationLower.includes('information technology security'))) {
    return EMAIL_TEMPLATES["Director of IT Security"];
  }
  if (designationLower.includes('director') && designationLower.includes('cyber')) {
    return EMAIL_TEMPLATES["Director Cybersecurity"];
  }
  if (designationLower.includes('risk') && designationLower.includes('compliance')) {
    return EMAIL_TEMPLATES["Risk & Compliance Manager"];
  }
  
  return EMAIL_TEMPLATES.default;
}

// ============ EMAIL TEMPLATES API ============

router.get("/templates", async (req, res) => {
  try {
    const templates = Object.entries(EMAIL_TEMPLATES).map(([key, value], index) => ({
      id: index + 1,
      key: key,
      name: value.name,
      subject: value.subject,
      designation: key === 'default' ? null : key,
      preview: value.body('John Doe').substring(0, 200) + '...'
    }));
    
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ EMAIL SCHEDULING ============

router.post("/schedule-emails", async (req, res) => {
  try {
    const { employees, template_key, scheduled_time } = req.body;
    
    if (!employees || employees.length === 0) {
      return res.status(400).json({ success: false, error: "No employees selected" });
    }
    
    let scheduled = 0;
    
    for (const emp of employees) {
      const template = template_key 
        ? EMAIL_TEMPLATES[template_key] || EMAIL_TEMPLATES.default
        : getEmailTemplate(emp.designation);
      
      const personalizedBody = template.body(emp.name || 'there');
      
      await pool.query(
        `INSERT INTO scheduled_emails 
         (employee_email, employee_name, designation, subject, body, scheduled_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [emp.email, emp.name, emp.designation, template.subject, personalizedBody, scheduled_time, 'pending']
      );
      scheduled++;
    }
    
    res.json({ success: true, scheduled: scheduled, message: `${scheduled} emails scheduled` });
  } catch (error) {
    console.error("Schedule error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/send-now", async (req, res) => {
  try {
    const { employees, template_key } = req.body;
    
    if (!employees || employees.length === 0) {
      return res.status(400).json({ success: false, error: "No employees selected" });
    }
    
    let scheduled = 0;
    
    for (const emp of employees) {
      const template = template_key 
        ? EMAIL_TEMPLATES[template_key] || EMAIL_TEMPLATES.default
        : getEmailTemplate(emp.designation);
      
      const personalizedBody = template.body(emp.name || 'there');
      
      await pool.query(
        `INSERT INTO scheduled_emails 
         (employee_email, employee_name, designation, subject, body, scheduled_time, status)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
        [emp.email, emp.name, emp.designation, template.subject, personalizedBody, 'pending']
      );
      scheduled++;
    }
    
    res.json({ success: true, scheduled: scheduled, message: `${scheduled} emails will be sent by n8n` });
  } catch (error) {
    console.error("Send now error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ N8N ENDPOINTS ============

router.get("/pending-emails", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, employee_email, employee_name, designation, subject, body, scheduled_time
       FROM scheduled_emails
       WHERE status = 'pending' AND scheduled_time <= NOW()
       ORDER BY scheduled_time ASC
       LIMIT 50`
    );
    res.json({ success: true, count: result.rows.length, emails: result.rows });
  } catch (error) {
    console.error("Error fetching pending emails:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/update-email-status", async (req, res) => {
  try {
    const { email_id, status, n8n_execution_id, error_message } = req.body;
    
    if (status === 'sent') {
      await pool.query(
        `UPDATE scheduled_emails SET status = $1, sent_at = NOW(), n8n_execution_id = $2 WHERE id = $3`,
        [status, n8n_execution_id, email_id]
      );
    } else if (status === 'failed') {
      await pool.query(
        `UPDATE scheduled_emails SET status = $1, error_message = $2, n8n_execution_id = $3 WHERE id = $4`,
        [status, error_message, n8n_execution_id, email_id]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ANALYTICS ============

router.get("/stats", async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened
      FROM scheduled_emails
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    res.json({ success: true, stats: stats.rows[0] });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Export EMAIL_TEMPLATES so other modules can use it
export { EMAIL_TEMPLATES };

export default router;