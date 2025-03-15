// Script to copy a real video file to our placeholder files
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

// Main function to copy video files
async function copyVideoFiles() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Get all videos with local file paths
    const { rows } = await client.query(`
      SELECT id, output_url, metadata 
      FROM videos 
      WHERE status = 'completed' AND output_url LIKE '/generated-videos/%'
    `);

    console.log(`Found ${rows.length} videos with local file paths`);

    // Get all real video files
    const generatedVideosDir = path.join(process.cwd(), 'public', 'generated-videos');
    const existingFiles = fs.readdirSync(generatedVideosDir);
    
    // Find real video files (larger than 10KB)
    const realVideoFiles = [];
    for (const file of existingFiles) {
      const filePath = path.join(generatedVideosDir, file);
      const stats = fs.statSync(filePath);
      if (stats.size > 10000) { // More than 10KB is likely a real video
        realVideoFiles.push({
          path: filePath,
          size: stats.size
        });
      }
    }

    console.log(`Found ${realVideoFiles.length} real video files`);
    
    if (realVideoFiles.length === 0) {
      console.log('No real video files found, exiting');
      return;
    }

    // Sort by size descending (largest first)
    realVideoFiles.sort((a, b) => b.size - a.size);

    // Process each video
    for (const video of rows) {
      try {
        // Get the target path from the output_url
        const targetPath = path.join(process.cwd(), 'public', video.output_url);
        
        // Check if the file already exists and has content
        if (fs.existsSync(targetPath)) {
          const stats = fs.statSync(targetPath);
          if (stats.size > 10000) {
            console.log(`Video ${video.id} already has a real file at ${targetPath}, skipping`);
            continue;
          }
        }
        
        // Get a real video file to copy
        const sourceFile = realVideoFiles[0].path; // Use the largest file
        
        console.log(`Copying ${sourceFile} to ${targetPath} for video ${video.id}`);
        
        // Ensure the directory exists
        const targetDir = path.dirname(targetPath);
        fs.mkdirSync(targetDir, { recursive: true });
        
        // Copy the file
        fs.copyFileSync(sourceFile, targetPath);
        
        console.log(`Successfully copied video file for video ${video.id}`);
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
      }
    }

    console.log('Finished copying video files');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Closed database connection');
  }
}

// Run the main function
copyVideoFiles(); 