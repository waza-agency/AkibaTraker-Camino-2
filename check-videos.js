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

    // Clean up failed videos
    await cleanupFailedVideos();

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Conexión a la base de datos cerrada');
  }
}

async function cleanupFailedVideos() {
  try {
    // Delete likes for problematic videos
    await client.query(`
      DELETE FROM video_likes 
      WHERE video_id IN (
        SELECT id FROM videos 
        WHERE status IN ('failed', 'error')
        OR metadata->>'error' IS NOT NULL
        OR output_url IS NULL
        OR output_url = ''
        OR (status = 'completed' AND (
          output_url NOT LIKE 'http%' 
          OR output_url NOT LIKE '/generated-videos/%'
        ))
        OR (metadata->>'progress' IS NOT NULL AND (
          CAST(metadata->>'progress' AS NUMERIC) < 0 
          OR CAST(metadata->>'progress' AS NUMERIC) > 100
        ))
      )
    `);
    
    // Delete problematic videos
    const result = await client.query(`
      DELETE FROM videos 
      WHERE status IN ('failed', 'error')
      OR metadata->>'error' IS NOT NULL
      OR output_url IS NULL
      OR output_url = ''
      OR (status = 'completed' AND (
        output_url NOT LIKE 'http%' 
        OR output_url NOT LIKE '/generated-videos/%'
      ))
      OR (metadata->>'progress' IS NOT NULL AND (
        CAST(metadata->>'progress' AS NUMERIC) < 0 
        OR CAST(metadata->>'progress' AS NUMERIC) > 100
      ))
      RETURNING id, prompt, status, output_url, metadata
    `);
    
    if (result.rows.length > 0) {
      console.log('\nCleaned up the following problematic videos:');
      result.rows.forEach(video => {
        console.log(`- ID ${video.id}:`);
        console.log(`  Prompt: ${video.prompt.substring(0, 50)}...`);
        console.log(`  Status: ${video.status}`);
        console.log(`  URL: ${video.output_url || 'None'}`);
        if (video.metadata?.error) {
          console.log(`  Error: ${video.metadata.error}`);
        }
        console.log('');
      });
    } else {
      console.log('No problematic videos found to clean up');
    }
  } catch (error) {
    console.error('Error cleaning up problematic videos:', error);
  }
}

// Run the main function
checkVideos(); 