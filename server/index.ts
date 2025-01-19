import express from "express";
import { json, urlencoded } from "express";
import { log } from "./vite"; // Retaining the original logging function

const app = express();

// Basic middleware
app.use(json());
app.use(urlencoded({ extended: false }));

// Basic health check route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
  log("GET /api/health 200 in 0ms"); // Added logging for the health check route
});

// Error handling (modified to use original log function)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: 'Internal Server Error' });
  log(`Error: ${err.message} - Status ${status}`); // Log the error
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  log(`Server running on port ${PORT}`);
});