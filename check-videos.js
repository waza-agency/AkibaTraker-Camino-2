import dotenv from 'dotenv';
import pg from 'pg';

// Initialize environment variables
dotenv.config();

// Database connection
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

// Main function to check videos
async function checkVideos() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Get all videos
    const { rows } = await client.query(`
      SELECT id, prompt, status, output_url, metadata
      FROM videos 
      ORDER BY id ASC
    `);

    console.log(`Total de videos en la base de datos: ${rows.length}`);
    
    // Count by status
    const statusCounts = {};
    for (const video of rows) {
      statusCounts[video.status] = (statusCounts[video.status] || 0) + 1;
    }
    
    console.log('Conteo por estado:');
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`  ${status}: ${count}`);
    }
    
    // List all videos
    console.log('\nListado de videos:');
    for (const video of rows) {
      console.log(`ID: ${video.id}, Estado: ${video.status}, Prompt: "${video.prompt.substring(0, 50)}${video.prompt.length > 50 ? '...' : ''}"`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Conexión a la base de datos cerrada');
  }
}

// Run the main function
checkVideos(); 