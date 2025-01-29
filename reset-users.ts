import { db } from "./db/index.js";
import { config } from "dotenv";

// Load environment variables
config();

async function resetUsers() {
  try {
    console.log('Starting users table reset...');
    
    // Truncate users table and reset sequence
    await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    console.log('Users table truncated');
    
    // Truncate password_resets table and reset sequence
    await db.query('TRUNCATE TABLE password_resets RESTART IDENTITY CASCADE');
    console.log('Password resets table truncated');
    
    console.log('All tables reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting tables:', error);
    process.exit(1);
  }
}

resetUsers(); 