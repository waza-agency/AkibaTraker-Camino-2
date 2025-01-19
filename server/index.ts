import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { 
  configureSecurityHeaders, 
  configureCors,
  apiErrorHandler 
} from "./middleware/security";
import { createServer } from "http";
import net from "net";

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

const checkPort = async (port: number, retries = 3): Promise<number> => {
  for (let i = 0; i < retries; i++) {
    const isAvailable = await new Promise<boolean>((resolve) => {
      const server = net.createServer()
        .once('error', () => {
          resolve(false);
        })
        .once('listening', () => {
          server.close();
          resolve(true);
        })
        .listen(port);
    });

    if (isAvailable) {
      return port;
    }

    log(`Port ${port} is in use, attempt ${i + 1}/${retries}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // If the preferred port is not available after retries, find a random available port
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('listening', () => {
        const port = (server.address() as net.AddressInfo).port;
        server.close(() => resolve(port));
      })
      .listen(0);
  });
};

const PREFERRED_PORT = 5000;

(async () => {
  let server;
  try {
    const port = await checkPort(PREFERRED_PORT);
    if (port !== PREFERRED_PORT) {
      log(`Using alternative port ${port} as ${PREFERRED_PORT} is not available`);
    }

    server = registerRoutes(app);

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

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Handle server shutdown gracefully
    const gracefulShutdown = (signal: string) => {
      console.log(`Received ${signal} signal. Closing server...`);

      // First stop accepting new connections
      server?.close(() => {
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

    // Add error handler for the server
    server.on('error', (error: any) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Exiting...`);
      }
      process.exit(1);
    });

    server.listen(port, "0.0.0.0", () => {
      log(`Server running on port ${port}`);
      log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();