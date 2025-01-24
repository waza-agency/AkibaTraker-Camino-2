import 'dotenv/config';
import express from "express";
import { json, urlencoded } from "express";
import cors from 'cors';
import { setupSecurityHeaders } from "./middleware/security";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { createServer } from 'http';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Debug environment
console.log('Starting server with env:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? 'exists' : 'missing'
});

// Basic middleware
app.use(json());
app.use(urlencoded({ extended: false }));

// CORS setup
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Security and auth
app.use(setupSecurityHeaders());
setupAuth(app);

// Routes
registerRoutes(app);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Application error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});