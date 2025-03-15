import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Initialize environment variables
dotenv.config();

// Database connection
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

// Main function to assign unique videos
async function assignUniqueVideos() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Get all completed videos
    const { rows } = await client.query(`
      SELECT id, prompt, status, output_url, metadata
      FROM videos 
      WHERE status = 'completed'
      ORDER BY id ASC
    `);

    console.log(`Found ${rows.length} completed videos`);
    
    // Get all real video files (larger than 1MB)
    const generatedVideosDir = path.join(process.cwd(), 'public', 'generated-videos');
    const files = fs.readdirSync(generatedVideosDir);
    
    const realVideoFiles = [];
    for (const file of files) {
      const filePath = path.join(generatedVideosDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 1000000) { // More than 1MB is a real video
          realVideoFiles.push(file);
        }
      } catch (error) {
        console.error(`Error checking file ${file}:`, error);
      }
    }
    
    console.log(`Found ${realVideoFiles.length} real video files`);
    
    if (realVideoFiles.length === 0) {
      console.error('No real video files found, exiting');
      return;
    }
    
    // Assign a unique video file to each video
    for (let i = 0; i < rows.length; i++) {
      const video = rows[i];
      // Use modulo to cycle through available videos if we have more videos than files
      const videoFile = realVideoFiles[i % realVideoFiles.length];
      const videoPath = `/generated-videos/${videoFile}`;
      
      console.log(`Assigning ${videoPath} to video ${video.id}`);
      
      // Update the database
      const metadata = video.metadata || {};
      metadata.outputUrl = videoPath;
      
      await client.query(`
        UPDATE videos 
        SET output_url = $1, metadata = $2
        WHERE id = $3
      `, [videoPath, metadata, video.id]);
      
      console.log(`Updated video ${video.id}`);
    }

    console.log('Finished assigning unique videos');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Closed database connection');
  }
}

// Run the main function
assignUniqueVideos(); 