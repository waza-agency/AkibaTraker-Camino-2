import pg from 'pg';
const { Pool } = pg;

console.log('Initializing database connection...');
console.log('Environment variables:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'exists' : 'missing',
  NODE_ENV: process.env.NODE_ENV
});

// Create a dummy DB object that will be used if the real DB connection fails
const dummyDb = {
  query: async () => ({ rows: [], rowCount: 0 }),
  connect: async () => ({
    query: async () => ({ rows: [], rowCount: 0 }),
    release: () => {}
  })
};

let pool;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set, using dummy DB");
  pool = dummyDb;
} else {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });

    // Test the connection but don't exit on failure
    pool.query('SELECT NOW()')
      .then(() => console.log('Database connection verified'))
      .catch(err => {
        console.error('Database connection failed:', err);
        console.warn('Continuing with limited functionality (no database features)');
        pool = dummyDb;
      });
  } catch (error) {
    console.error('Error creating database pool:', error);
    console.warn('Continuing with limited functionality (no database features)');
    pool = dummyDb;
  }
}

export { pool as db };
