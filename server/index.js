const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic health check route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
  console.log("GET /api/health 200");
});

// Error handling
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: 'Internal Server Error' });
  console.log(`Error: ${err.message} - Status ${status}`);
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
