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

// Apply security headers middleware
app.use(setupSecurityHeaders());

// Register all routes
(async () => {
  const server = registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({ error: 'Internal Server Error' });
    log(`Error: ${err.message} - Status ${status}`);
  });

  // Setup Vite in development or serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  server.listen(PORT, '0.0.0.0', () => {
    log(`Server running on port ${PORT}`);
  });
})();