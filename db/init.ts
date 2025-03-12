import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { db } from "./db";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
  try {
    const migrationFile = path.join(__dirname, 'migrations/schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    await pool.query(sql);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function main() {
  try {
    // Clear existing music library
    await db.query('DELETE FROM music_library');
    console.log('Cleared existing music library');

    // Add new track
    await db.query(
      'INSERT INTO music_library (title, artist, mood, storage_url) VALUES ($1, $2, $3, $4)',
      [
        'Pon Pon Pon',
        'Kyary Pamyu Pamyu',
        'Party',
        'https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeiexrz2iyivgepluiurdcfbfgtctfcdkwggv4ec3b3suumkrwk6k5i'
      ]
    );
    console.log('Added new track to music library');

    // Verify the update
    const result = await db.query('SELECT * FROM music_library');
    console.log('Current music library:', result.rows);

  } catch (error) {
    console.error('Error updating database:', error);
    process.exit(1);
  }
}

runMigrations();
main().catch(console.error); 