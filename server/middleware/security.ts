import { type Request, type Response, type NextFunction } from 'express';

// Configure CSP headers
export const configureSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // CSP headers for Google APIs
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://apis.google.com",
      "connect-src 'self' https://*.googleapis.com https://apis.google.com https://generativelanguage.googleapis.com",
      "img-src 'self' data: https: blob:",
      "style-src 'self' 'unsafe-inline'",
      "frame-ancestors 'none'",
      "font-src 'self' data:",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'"
    ].join('; ')
  );

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

// Configure CORS for Google API requests
export const configureCors = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'https://generativelanguage.googleapis.com',
    'https://apis.google.com',
    'https://*.googleapis.com'
  ];

  const origin = req.headers.origin;

  // Check if the origin matches any allowed pattern
  const isAllowedOrigin = origin && allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      const pattern = new RegExp('^' + allowed.replace('*.', '.*\\.'));
      return pattern.test(origin);
    }
    return allowed === origin;
  });

  if (isAllowedOrigin && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '3600');

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

  // Check for required headers
  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(400).json({ error: 'Invalid content type. Expected application/json' });
  }

  next();
};

// Error handler for API requests
export const apiErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  // Handle specific Google API errors
  if (err.message.includes('Google API error')) {
    return res.status(502).json({
      error: 'Google API Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Error communicating with Google services'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};