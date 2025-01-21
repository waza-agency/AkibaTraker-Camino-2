import { type Request, type Response, type NextFunction } from "express";

export function setupSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set CSP headers
    res.setHeader(
      'Content-Security-Policy',
      [
        // Default restrictive policy
        "default-src 'self'",
        // Allow Google APIs
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.googleapis.com",
        "connect-src 'self' https://apis.google.com https://*.googleapis.com https://generativelanguage.googleapis.com",
        // Allow inline styles and specific style sources
        "style-src 'self' 'unsafe-inline'",
        // Allow images from self and data URIs
        "img-src 'self' data: blob: https:",
        // Allow media from self
        "media-src 'self' blob:",
        // Frame ancestors
        "frame-ancestors 'none'",
        // Report violations to our endpoint
        "report-uri /api/csp/report"
      ].join('; ')
    );

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
  };
}
