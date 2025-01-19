import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { 
  configureSecurityHeaders, 
  configureCors,
  apiErrorHandler 
} from "./middleware/security";
import { createServer } from "http";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security middleware
app.use(configureSecurityHeaders);
app.use(configureCors);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// API error handling
app.use("/api", apiErrorHandler);

(async () => {
  try {
    const server = registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Unhandled error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ 
        message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    });

    // Setup Vite in development mode
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Handle server shutdown gracefully
    const gracefulShutdown = (signal: string) => {
      console.log(`Received ${signal} signal. Closing server...`);
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });

      // Force close after timeout
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Function to try starting the server on a port
    const startServer = (port: number) => {
      return new Promise<number>((resolve, reject) => {
        server.once('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying next port...`);
            resolve(port + 1);
          } else {
            reject(err);
          }
        });

        server.listen(port, "0.0.0.0", () => {
          console.log(`Server started successfully on port ${port}`);
          resolve(0); // 0 indicates success
        });
      });
    };

    // Try ports starting from 5000
    let currentPort = 5000;
    while (currentPort < 5010) { // Try up to port 5009
      const result = await startServer(currentPort);
      if (result === 0) {
        log(`Server running on port ${currentPort}`);
        log(`Environment: ${process.env.NODE_ENV}`);
        break;
      }
      currentPort = result;
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();