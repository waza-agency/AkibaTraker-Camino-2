import 'dotenv/config';
import express, { Express, ErrorRequestHandler } from 'express';
import { createServer } from 'http';
import session from 'express-session';
import passport from 'passport';
import { setupAuth } from './auth.js';
import memorystore from 'memorystore';
import cors from 'cors';
import { setupVite } from './vite';
import path from 'path';
import { setupSecurityHeaders } from './middleware/security';
import { videosRouter } from './routes/videos';
import musicRoutes from './routes/music';
import audioRoutes from './routes/audio';
import { registerRoutes } from "./routes";
import fs from 'fs';
import { execSync } from 'child_process';
//import { db } from './db/client.js';  // or whatever the correct path to your DB module is

// Log environment for debugging
console.log('Environment:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
  NODE_ENV: process.env.NODE_ENV
});

// Global error handling for unhandled exceptions and rejections
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  // Don't crash the app, but log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  // Don't crash the app, but log the error
});

// Define process signal handlers for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Enhanced error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Log error with more details and structure
  console.error('Global error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: process.env.NODE_ENV === 'production' ? '[redacted]' : req.body,
    timestamp: new Date().toISOString()
  });

  // Ensure headers haven't been sent
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production' 
        ? 'An internal error occurred' 
        : err.message,
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }
};

// Helper functions for health checks
async function checkDbConnection() {
  try {
    // Try a simple query to check DB connection
    await db.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

async function checkFileSystemAccess() {
  try {
    // Check if we can access public directories
    const publicDir = path.join(process.cwd(), 'public');
    await fs.promises.access(publicDir, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (error) {
    console.error('Filesystem health check failed:', error);
    return false;
  }
}

async function checkFfmpegAvailability() {
  try {
    // Try to execute ffmpeg -version
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error('FFmpeg health check failed:', error);
    return false;
  }
}

// Server initialization function
async function startServer() {
  try {
    // Initialize server and all required services
    const app = express();
    const server = createServer(app);
    
    // Create MemoryStore
    const MemoryStore = memorystore(session);

    // Add security headers
    app.use(setupSecurityHeaders());

    // Configure CORS
    app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      exposedHeaders: ['Content-Range', 'X-Content-Range']
    }));

    // Body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Update session configuration
    app.use(session({
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      secret: process.env.SESSION_SECRET || 'your-fallback-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Set up auth (this includes all auth routes now)
    setupAuth(app);

    // Serve static files from public directory
    app.use(express.static(path.join(process.cwd(), 'public')));
    app.use('/generated-videos', express.static(path.join(process.cwd(), 'public', 'generated-videos')));
    app.use('/trimmed-audio', express.static(path.join(process.cwd(), 'public', 'trimmed-audio')));

    // Add custom middleware for video files with proper error handling
    app.use('/generated-videos', (req, res, next) => {
      const videoPath = path.join(process.cwd(), 'public', 'generated-videos', path.basename(req.path));
      
      // Check if file exists
      fs.access(videoPath, fs.constants.F_OK, (err) => {
        if (err) {
          // File doesn't exist - return a proper 404 with JSON instead of HTML
          res.status(404).set('Content-Type', 'application/json').send({
            error: 'Video not found',
            path: req.path
          });
          return;
        }
        
        // File exists, set the correct MIME type and continue
        if (req.path.endsWith('.mp4')) {
          res.set('Content-Type', 'video/mp4');
        } else if (req.path.endsWith('.webm')) {
          res.set('Content-Type', 'video/webm');
        }
        
        // Continue to the static file middleware
        next();
      });
    });

    // Register all API routes
    registerRoutes(app);

    // Add this before the catch-all route
    app.use('/api/audio', audioRoutes);

    // Setup Vite middleware in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Setting up Vite middleware...');
      await setupVite(app, server);
    } else {
      // This should be the last route
      app.get('*', (req, res) => {
        // Only handle non-API routes with the catch-all
        if (!req.path.startsWith('/api/')) {
          res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
        }
      });
    }

    // Add health check endpoint
    app.get('/health', async (req, res) => {
      try {
        // Check filesystem access
        const fsHealthy = await checkFileSystemAccess();
        
        // Check if ffmpeg is available
        const ffmpegHealthy = await checkFfmpegAvailability();
        
        // Simplified health check that doesn't depend on DB
        const healthy = fsHealthy && ffmpegHealthy;
        
        if (healthy) {
          res.status(200).json({ 
            status: 'healthy',
            checks: {
              filesystem: fsHealthy,
              ffmpeg: ffmpegHealthy
            }
          });
        } else {
          res.status(503).json({ 
            status: 'unhealthy',
            checks: {
              filesystem: fsHealthy,
              ffmpeg: ffmpegHealthy
            }
          });
        }
      } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({ 
          status: 'unhealthy',
          error: error.message 
        });
      }
    });

    // Add these middleware before the global error handler
    app.use((err, req, res, next) => {
      // Handle video processing errors
      if (err.message && (
          err.message.includes('FFmpeg') || 
          err.message.includes('video') || 
          err.message.includes('IPFS'))) {
        console.error('Video processing error:', err);
        return res.status(422).json({
          error: 'Video processing failed',
          details: process.env.NODE_ENV === 'production' ? null : err.message
        });
      }
      next(err);
    });

    app.use((err, req, res, next) => {
      // Handle database connection errors
      if (err.code && ['ECONNREFUSED', '57P01', '57P02', '57P03'].includes(err.code)) {
        console.error('Database connection error:', err);
        return res.status(503).json({
          error: 'Database service unavailable',
          details: process.env.NODE_ENV === 'production' ? null : err.message
        });
      }
      next(err);
    });

    // Add the global error handler
    app.use(errorHandler);

    // Start the server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      if (process.env.DATABASE_URL) {
        console.log(`Database URL: ${process.env.DATABASE_URL.slice(0, 25)}...`);
      }
    });
    
    // Return server and app for possible use elsewhere
    return { app, server };
  } catch (error) {
    console.error('Critical error during server startup:', error);
    process.exit(1);
  }
}

// Graceful shutdown function
function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, starting graceful shutdown`);
  
  // Get reference to the server
  const server = global.server; // Assuming server is stored globally
  
  if (!server) {
    console.error('Server not found for graceful shutdown');
    process.exit(1);
    return;
  }
  
  // Add timeout to force exit if graceful shutdown takes too long
  const forcedExitTimeout = setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000); // 30 seconds timeout
  
  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
    
    // Clean up other resources
    clearTimeout(forcedExitTimeout);
    
    // Close DB pool if it exists and has an end method
    if (db && typeof db.end === 'function') {
      db.end().then(() => {
        console.log('Database connections closed');
        process.exit(0);
      }).catch(err => {
        console.error('Error closing database connections:', err);
        process.exit(1);
      });
    } else {
      process.exit(0);
    }
  });
}

// Start the server and store the reference globally
startServer()
  .then(({ server }) => {
    global.server = server;
  })
  .catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

export const app = express();
const server = createServer(app);

// Rest of your code should come AFTER this initialization
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import cors from 'cors';

// ... keep all other code the same but ensure:
// 1. No references to app before its declaration
// 2. All middleware/routes come after app initialization

// Remove any duplicate app = express() declarations
// Ensure this is the ONLY app initialization in the file