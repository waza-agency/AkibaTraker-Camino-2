import { type Request, type Response, type NextFunction } from "express";

export function setupSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    const host = req.get('host') || '';
    const isDev = process.env.NODE_ENV === 'development' || host.includes('.replit.dev') || host.includes('.worf.replit.dev');

    // Deshabilitar CSP en desarrollo para descartar problemas
    // Solo mantener headers básicos de seguridad
    
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
