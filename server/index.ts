import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*.replit.dev, *.repl.co');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-fal-api-key, x-google-api-key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: *.replit.dev *.repl.co; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: https://apis.google.com https://*.googleapis.com https://*.google.com https://ai.google.dev https://*.stripe.com https://elevenlabs.io https://*.elevenlabs.io https://*.fal.ai *.replit.dev *.repl.co; " +
    "style-src 'self' 'unsafe-inline' https: *.replit.dev *.repl.co; " +
    "img-src 'self' data: https: blob: https://*.mypinata.cloud https://*.fal.ai https://*.elevenlabs.io *.replit.dev *.repl.co; " +
    "connect-src 'self' https: wss: http://0.0.0.0:* ws://0.0.0.0:* https://*.googleapis.com https://generativelanguage.googleapis.com https://ai.google.dev https://ai-api.google.com https://*.fal.ai wss://* https://*.mypinata.cloud https://*.stripe.com https://elevenlabs.io https://*.elevenlabs.io *.replit.dev *.repl.co; " +
    "media-src 'self' https: blob: https://*.mypinata.cloud https://*.fal.ai https://*.elevenlabs.io *.replit.dev *.repl.co; " +
    "frame-src 'self' https://*.replit.dev https://*.repl.co https://*.elevenlabs.io; " +
    "font-src 'self' data: https: *.replit.dev *.repl.co; " +
    "worker-src 'self' blob: https://*.elevenlabs.io; " +
    "child-src 'self' blob: https://*.elevenlabs.io; " +
    "worklet-src 'self' blob: https://*.elevenlabs.io"
  );

  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();