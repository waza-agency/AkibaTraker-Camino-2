import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: *.replit.dev; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: https://apis.google.com https://*.googleapis.com https://*.stripe.com https://elevenlabs.io https://*.elevenlabs.io *.replit.dev; " +
    "style-src 'self' 'unsafe-inline' https: *.replit.dev; " +
    "img-src 'self' data: https: blob: https://*.mypinata.cloud https://*.fal.ai https://*.elevenlabs.io *.replit.dev; " +
    "connect-src 'self' http://localhost:* ws://localhost:* https://*.googleapis.com https://generativelanguage.googleapis.com https://ai-api.google.com https://*.fal.ai wss://* https://*.mypinata.cloud https://evmos-evm.publicnode.com https://*.stripe.com https://elevenlabs.io https://*.elevenlabs.io wss://*.elevenlabs.io *.replit.dev; " +
    "media-src 'self' https: blob: https://*.mypinata.cloud https://*.fal.ai https://*.elevenlabs.io *.replit.dev; " +
    "frame-src 'self' https://*.replit.dev https://*.repl.co https://*.elevenlabs.io; " +
    "font-src 'self' data: https: *.replit.dev; " +
    "worker-src 'self' blob: https://*.elevenlabs.io; " +
    "child-src 'self' blob: https://*.elevenlabs.io; " +
    "worklet-src 'self' blob: https://*.elevenlabs.io;"
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