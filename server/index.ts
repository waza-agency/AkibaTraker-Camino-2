import 'dotenv/config';
import express from 'express';
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
import { ErrorRequestHandler } from 'express';

// Log environment for debugging
console.log('Environment:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
  NODE_ENV: process.env.NODE_ENV
});

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

// Add process-level error handling
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  // Don't crash the app, but log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  // Don't crash the app, but log the error
});

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

// Add global error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'An internal error occurred' 
      : err.message
  });
};

// Add after your routes registration
app.use(errorHandler);

// Add graceful shutdown
function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, starting graceful shutdown`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Initialize routes and start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database URL: ${process.env.DATABASE_URL?.slice(0, 25)}...`);
});

export default app;