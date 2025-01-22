import { type Request, type Response, type NextFunction } from "express";

export function setupSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set CSP headers with more permissive settings for Google APIs
    res.setHeader(
      'Content-Security-Policy',
      [
        // Default restrictive policy
        "default-src 'self'",
        // Allow Google APIs and inline scripts needed for Google integration
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://apis.google.com",
        // Allow connections to Google APIs
        "connect-src 'self' https://*.googleapis.com https://generativelanguage.googleapis.com",
        // Allow styles from our domain and inline styles
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        // Allow images from our domain and Google domains
        "img-src 'self' data: blob: https: https://*.googleapis.com",
        // Allow fonts from Google
        "font-src 'self' https://fonts.gstatic.com",
        // Frame ancestors restriction
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
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    next();
  };
}