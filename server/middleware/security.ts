import { type Request, type Response, type NextFunction } from 'express';

// Configure CSP headers
export const configureSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // CSP headers for Google APIs
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // Allow scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://apis.google.com https://www.gstatic.com",
      // Allow connections
      `connect-src 'self' http://localhost:5000 https://*.googleapis.com https://apis.google.com wss: ws: http: https:`,
      // Allow images from various sources
      "img-src 'self' data: https: blob:",
      // Allow styles
      "style-src 'self' 'unsafe-inline'",
      // Allow frames for development
      "frame-ancestors 'self'",
      // Allow fonts
      "font-src 'self' data: https://fonts.gstatic.com",
      // Form submissions
      "form-action 'self'",
      // Base URI restriction
      "base-uri 'self'",
      // Object sources
      "object-src 'none'",
      // Media sources
      "media-src 'self' blob: https://*.googleapis.com"
    ].join('; ')
  );

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Changed from DENY to allow development
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};

// Configure CORS for development
export const configureCors = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  // Allow requests from development environments and same origin
  if (!origin || 
      origin === 'null' || 
      origin.startsWith('http://localhost') || 
      origin.includes('.repl.co')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 
    'X-Requested-With, Content-Type, Authorization, Accept'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
};

// Validate Google API requests
export const validateGoogleRequest = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error('Google API key not configured');
    return res.status(500).json({ error: 'API configuration error' });
  }

  // Add Google API key to request for downstream handlers
  if (!req.headers.authorization) {
    req.headers.authorization = `Bearer ${apiKey}`;
  }

  next();
};

// API error handler
export const apiErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  // Handle rate limiting errors
  if (err.message.includes('quota') || err.message.includes('rate limit')) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }

  // Generic error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};