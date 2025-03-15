// Script to update video output_url fields from metadata
import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

// Initialize environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Main function to update video URLs
async function updateVideoUrls() {
  try {
    console.log('Starting to update video URLs...');
    
    // Get all videos that have outputUrl in metadata but not in output_url field
    const result = await pool.query(`
      SELECT id, prompt, status, metadata, output_url
      FROM videos
      WHERE metadata->>'outputUrl' IS NOT NULL
      ORDER BY id ASC
    `);
    
    console.log(`Found ${result.rows.length} videos with outputUrl in metadata`);
    
    // Process each video
    for (const video of result.rows) {
      try {
        const metadata = video.metadata;
        const outputUrl = metadata.outputUrl;
        
        if (outputUrl && !video.output_url) {
          console.log(`Updating video ${video.id} output_url to ${outputUrl}`);
          
          // Update the output_url field
          await pool.query(
            'UPDATE videos SET output_url = $1, updated_at = NOW() WHERE id = $2',
            [outputUrl, video.id]
          );
          
          console.log(`Successfully updated video ${video.id}`);
        } else {
          console.log(`Video ${video.id} already has output_url or no outputUrl in metadata`);
        }
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
      }
    }
    
    console.log('Finished updating video URLs');
    
    // Now check all completed videos to make sure they have output_url set
    const completedResult = await pool.query(`
      SELECT id, prompt, status, metadata, output_url
      FROM videos
      WHERE status = 'completed'
      ORDER BY id ASC
    `);
    
    console.log(`Found ${completedResult.rows.length} completed videos`);
    
    // Process each completed video
    for (const video of completedResult.rows) {
      try {
        if (!video.output_url) {
          const metadata = video.metadata;
          const outputUrl = metadata.outputUrl;
          
          if (outputUrl) {
            console.log(`Updating completed video ${video.id} output_url to ${outputUrl}`);
            
            // Update the output_url field
            await pool.query(
              'UPDATE videos SET output_url = $1, updated_at = NOW() WHERE id = $2',
              [outputUrl, video.id]
            );
            
            console.log(`Successfully updated completed video ${video.id}`);
          } else {
            console.log(`Completed video ${video.id} has no outputUrl in metadata`);
          }
        } else {
          console.log(`Completed video ${video.id} already has output_url set to ${video.output_url}`);
        }
      } catch (error) {
        console.error(`Error processing completed video ${video.id}:`, error);
      }
    }
    
    console.log('Finished updating completed video URLs');
  } catch (error) {
    console.error('Error updating video URLs:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the script
updateVideoUrls().catch(console.error); 