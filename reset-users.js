import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function resetUsers() {
  const client = await pool.connect();
  
  try {
    console.log('Starting users table reset...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Truncate users table and reset sequence
    await client.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    console.log('Users table truncated');
    
    // Truncate password_resets table and reset sequence
    await client.query('TRUNCATE TABLE password_resets RESTART IDENTITY CASCADE');
    console.log('Password resets table truncated');
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('All tables reset successfully!');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error resetting tables:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

resetUsers(); 