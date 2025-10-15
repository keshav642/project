import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

console.log("AUTH0_DOMAIN:", process.env.AUTH0_DOMAIN);
console.log("AUTH0_AUDIENCE:", process.env.AUTH0_AUDIENCE);
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic routes
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

const startServer = async () => {
  try {
    // ============================================
    // Auth0 Middleware
    // ============================================
    const { checkJwt, addUserInfo } = await import("./middleware/auth0.js");
    
    // ============================================
    // Import all route modules
    // ============================================
    
    // Existing routes
    const usersModule = await import("./routes/users.js");
    const usersRouter = usersModule.default;
    
    const googleAuthModule = await import("./routes/googleAuth.js");
    const googleAuthRouter = googleAuthModule.default;
    
    const googleDocsModule = await import("./routes/googleDocs.js");
    const googleDocsRouter = googleDocsModule.default;
    
    const leadsModule = await import("./routes/leads.js");
    const leadsRouter = leadsModule.default;
    
    const automationModule = await import("./routes/automation.js");
    const automationRouter = automationModule.default;
    
    // ============================================
    // NEW ROUTES - Lead Management System
    // ============================================
    
    const sourcesModule = await import("./routes/sources.js");
    const sourcesRouter = sourcesModule.default;
    
    const campaignsModule = await import("./routes/campaigns.js");
    const campaignsRouter = campaignsModule.default;
    
    const uploadModule = await import("./routes/upload.js");
    const uploadRouter = uploadModule.default;
    
    // ============================================
    // Register all routes
    // ============================================
    
    // Auth0 protected routes
    app.use("/api/users", checkJwt, addUserInfo, usersRouter);
    
    // Google OAuth routes
    app.use(googleAuthRouter);
    app.use("/api/google/docs", googleDocsRouter);
    
    // Lead management routes
    app.use("/api/leads", leadsRouter);
    
    // Email automation routes
    app.use("/api/automation", automationRouter);
    
    // ============================================
    // NEW: Lead Sources Management
    // ============================================
    app.use("/api/sources", sourcesRouter);
    
    // ============================================
    // NEW: Campaign Management
    // ============================================
    app.use("/api/campaigns", campaignsRouter);
    
    // ============================================
    // NEW: File Upload for Leads
    // ============================================
    app.use("/api/upload", uploadRouter);
    
    // ============================================
    // Error handling middleware
    // ============================================
    app.use((err, req, res, next) => {
      if (err.name === 'UnauthorizedError') {
        res.status(401).json({ message: 'Invalid token' });
      } else if (err instanceof multer.MulterError) {
        // Multer file upload errors
        res.status(400).json({ message: 'File upload error', error: err.message });
      } else {
        console.error('Server error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
    
    // ============================================
    // Start server
    // ============================================
    app.listen(PORT, () => {
      console.log(`\n✅ ========================================`);
      console.log(`✅  Server running on http://localhost:${PORT}`);
      console.log(`✅ ========================================\n`);
      console.log(`📋 Available routes:`);
      console.log(`   - /api/test`);
      console.log(`   - /api/users (protected)`);
      console.log(`   - /api/leads`);
      console.log(`   - /api/automation`);
      console.log(`   - /api/sources (NEW)`);
      console.log(`   - /api/campaigns (NEW)`);
      console.log(`   - /api/upload (NEW)`);
      console.log(`   - /api/google/docs`);
      console.log(`   - /auth/google`);
      console.log(`\n`);
    });
    
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// ============================================
// Graceful shutdown
// ============================================
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// ============================================
// Start the server
// ============================================
startServer();