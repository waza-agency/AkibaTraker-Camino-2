import { type Request, type Response, type NextFunction } from "express";

export function setupSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    const host = req.get('host') || '';
    const isDev = process.env.NODE_ENV === 'development' || host.includes('.replit.dev') || host.includes('.worf.replit.dev');

    // Unified CSP for both development and production
    const cspDirectives = [
      // Allow connections to Google AI API and other necessary services
      "default-src 'self' https://*.googleapis.com https://elevenlabs.io",
      // Allow scripts from trusted sources
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://elevenlabs.io https://*.elevenlabs.io",
      // Allow connections to APIs and WebSocket
      "connect-src 'self' https://*.googleapis.com https://generativelanguage.googleapis.com wss: ws: https://lime-zygomorphic-vicuna-674.mypinata.cloud https://*.fal.ai https://*.elevenlabs.io *",
      // Allow styles from trusted sources
      "style-src 'self' 'unsafe-inline' https://elevenlabs.io",
      // Allow images from various sources
      "img-src 'self' data: blob: https: *",
      // Allow fonts
      "font-src 'self' data: https://elevenlabs.io",
      // Allow frames for external services
      "frame-src 'self' https: https://elevenlabs.io",
      // Allow media
      "media-src 'self' data: blob: https: *",
      // Allow workers
      "worker-src 'self' blob:",
      // CSP reporting
      "report-uri /api/csp/report"
    ].join('; ');

    res.setHeader('Content-Security-Policy', cspDirectives);

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
