import pg from 'pg';
const { Pool } = pg;

console.log('Initializing database connection...');
console.log('Environment variables:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'exists' : 'missing',
  NODE_ENV: process.env.NODE_ENV
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.query('SELECT NOW()')
  .then(() => console.log('Database connection verified'))
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1); // Terminate if DB connection fails
  });

export { pool as db };
