import express from "express";
import { json, urlencoded } from "express";
import { log } from "./vite";
import { setupSecurityHeaders } from "./middleware/security";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

const app = express();

// Basic middleware
app.use(json());
app.use(urlencoded({ extended: false }));

// Apply security headers middleware before routes
app.use(setupSecurityHeaders());

// Development proxy middleware to handle host blocking
app.use((req, res, next) => {
  const host = req.get('host') || '';
  // Add the host to allowed origins for development
  if (host.includes('.replit.dev') || host.includes('.worf.replit.dev')) {
    res.setHeader('Access-Control-Allow-Origin', `https://${host}`);
  }
  next();
});

// Register all routes and set up error handling
(async () => {
  try {
    const server = registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error("Application error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`serving on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();