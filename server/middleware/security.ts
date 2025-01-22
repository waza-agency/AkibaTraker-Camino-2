import { type Request, type Response, type NextFunction } from "express";

export function setupSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get the host from the request
    const host = req.get('host') || '';
    const isDev = host.includes('.replit.dev') || host.includes('.worf.replit.dev');

    // Development CORS headers
    if (isDev) {
      res.setHeader('Access-Control-Allow-Origin', `https://${host}`);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Fal-Api-Key');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Set CSP headers with development-friendly settings
    res.setHeader(
      'Content-Security-Policy',
      [
        // Allow everything from same origin and Replit domains
        `default-src 'self' https://${host} https://*.replit.dev https://*.worf.replit.dev`,
        // Allow necessary scripts with eval for development
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://${host} https://*.googleapis.com https://apis.google.com https://*.replit.dev https://*.worf.replit.dev`,
        // Allow connections to all necessary APIs and WebSocket
        `connect-src 'self' wss://${host} ws://${host} https://${host} https://*.googleapis.com https://generativelanguage.googleapis.com https://*.replit.dev https://*.worf.replit.dev`,
        // Allow styles needed for development
        `style-src 'self' 'unsafe-inline' https://${host} https://fonts.googleapis.com https://*.replit.dev https://*.worf.replit.dev`,
        // Allow images from trusted sources
        `img-src 'self' data: blob: https: https://${host} https://*.googleapis.com https://*.replit.dev https://*.worf.replit.dev`,
        // Allow fonts
        `font-src 'self' https://${host} https://fonts.gstatic.com https://*.replit.dev https://*.worf.replit.dev`,
        // Frame ancestors - allow all in development
        isDev ? "frame-ancestors *" : "frame-ancestors 'self' https://*.replit.com",
        // Report violations
        "report-uri /api/csp/report"
      ].join('; ')
    );

    // Development-friendly security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', isDev ? 'ALLOWALL' : 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Only set HSTS in production
    if (!isDev) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  };
}