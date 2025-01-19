import { type Request, type Response, type NextFunction } from 'express';

// Configure CSP headers
export const configureSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // CSP headers for Google APIs
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://apis.google.com",
      "connect-src 'self' https://*.googleapis.com https://apis.google.com https://generativelanguage.googleapis.com ws: wss:",
      "img-src 'self' data: https: blob:",
      "style-src 'self' 'unsafe-inline'",
      "frame-ancestors 'none'",
      "font-src 'self' data:",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "media-src 'self' blob: https://*.googleapis.com"
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

  // Allow requests from the same origin
  if (!origin || origin === 'null' || origin.startsWith('http://localhost') || origin.startsWith('https://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // Check if the origin matches any allowed pattern
    const isAllowedOrigin = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = new RegExp('^' + allowed.replace('*.', '.*\\.'));
        return pattern.test(origin);
      }
      return allowed === origin;
    });

    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 
    'X-Requested-With, Content-Type, Authorization, X-Custom-Header, Accept'
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

  // Validate request headers
  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(400).json({ error: 'Invalid content type. Expected application/json' });
  }

  // Add Google API key to request for downstream handlers
  req.headers['x-goog-api-key'] = apiKey;

  next();
};

// API error handler
export const apiErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  // Handle Google API specific errors
  if (err.message.includes('Google API error') || err.message.includes('googleapis')) {
    return res.status(502).json({
      error: 'Google API Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Error communicating with Google services',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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