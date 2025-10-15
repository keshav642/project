import express from "express";
import { google } from "googleapis";
import pool from "../db.js";

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
];

// Step 1: Generate auth URL
router.get("/auth/google", (req, res) => {
  const { userId } = req.query;
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: userId
  });
  
  res.redirect(authUrl);
});

// Step 2: Handle callback and store token
router.get("/auth/google/callback", async (req, res) => {
  const { code, state } = req.query;
  const userId = state;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    await pool.query(
      `INSERT INTO google_tokens (user_id, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE 
       SET access_token = $2, refresh_token = $3, expires_at = $4`,
      [
        userId || 'default_user', 
        tokens.access_token, 
        tokens.refresh_token, 
        Date.now() + (tokens.expiry_date || 3600000)
      ]
    );
    
    res.redirect("http://localhost:5173/dashboard?google_connected=true");
    
  } catch (error) {
    console.error("Error getting tokens:", error);
    res.redirect("http://localhost:5173/dashboard?error=google_auth_failed");
  }
});

// Get token for user
router.get("/google/token/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT * FROM google_tokens WHERE user_id = $1",
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Token not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching token:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Disconnect Google - Delete token
router.delete("/google/disconnect/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.query("DELETE FROM google_tokens WHERE user_id = $1", [userId]);
    res.json({ message: "Google account disconnected successfully" });
  } catch (error) {
    console.error("Error disconnecting:", error);
    res.status(500).json({ error: "Failed to disconnect" });
  }
});

export default router;