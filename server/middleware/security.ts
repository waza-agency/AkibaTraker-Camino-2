import { type Request, type Response, type NextFunction } from "express";

export function setupSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    const host = req.get('host') || '';
    const isDev = host.includes('.replit.dev') || host.includes('.worf.replit.dev');

    if (process.env.NODE_ENV === 'development') {
      // Most permissive CSP for development
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
          "script-src * 'unsafe-inline' 'unsafe-eval'",
          "connect-src * 'unsafe-inline' 'unsafe-eval' ws: wss:",
          "style-src * 'unsafe-inline'",
          "img-src * data: blob:",
          "font-src * data:",
          "frame-src *",
          "media-src * data: blob:",
          "worker-src * blob:",
          "report-uri /api/csp/report"
        ].join('; ')
      );

      // Development CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
    } else {
      // Production CSP headers (more restrictive)
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "connect-src 'self' ws: wss:",
          "media-src 'self' data: blob:",
          "frame-src 'self'",
          "worker-src 'self' blob:",
          "report-uri /api/csp/report"
        ].join('; ')
      );
    }

    // Other security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', isDev ? 'ALLOWALL' : 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    if (!isDev) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  };
}
