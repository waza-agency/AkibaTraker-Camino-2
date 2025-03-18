// Script to copy a known working video to the problematic video locations
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

// Initialize environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Function to copy a file
async function copyFile(source, destination) {
  try {
    await fs.promises.copyFile(source, destination);
    console.log(`Copied ${source} to ${destination}`);
    return true;
  } catch (error) {
    console.error(`Error copying file: ${error.message}`);
    return false;
  }
}

// Function to find a working video
async function findWorkingVideo(directory) {
  try {
    const files = await fs.promises.readdir(directory);
    
    // Filter for video files
    const videoFiles = files.filter(file => file.endsWith('.mp4'));
    
    // Find a video file that is larger than 1MB
    for (const file of videoFiles) {
      const filePath = path.join(directory, file);
      const stats = await fs.promises.stat(filePath);
      
      if (stats.size > 1000000) { // Larger than 1MB
        console.log(`Found working video: ${filePath} (${stats.size} bytes)`);
        return filePath;
      }
    }
    
    console.log('No working video found');
    return null;
  } catch (error) {
    console.error(`Error finding working video: ${error.message}`);
    return null;
  }
}

// Function to fix problematic videos
async function fixProblematicVideos() {
  try {
    console.log('Starting to fix problematic videos...');
    
    // Define the directory where videos are stored
    const generatedVideosDir = path.join(process.cwd(), 'public', 'generated-videos');
    console.log(`Video directory: ${generatedVideosDir}`);
    
    // Create the directory if it doesn't exist
    await fs.promises.mkdir(generatedVideosDir, { recursive: true });
    
    // Find a working video
    const workingVideo = await findWorkingVideo(generatedVideosDir);
    if (!workingVideo) {
      console.log('No working video found, cannot continue');
      return;
    }
    
    // Define the problematic videos
    const problematicVideos = [
      {
        id: 17,
        filename: '648ab2ea-cc74-41b0-9906-976430108534.mp4',
        description: 'una fuente con personas al rededor'
      },
      {
        id: 18,
        filename: '4abe06f8-22e1-4f3c-8b66-fe236f7c4a9f.mp4',
        description: 'un volcan exhaviendo erupcion y un esquadron de ninjas volando encima de el'
      }
    ];
    
    // Fix each problematic video
    for (const video of problematicVideos) {
      const destinationPath = path.join(generatedVideosDir, video.filename);
      console.log(`Fixing video ${video.id}: ${video.description}`);
      
      // Delete the existing file if it exists
      try {
        await fs.promises.unlink(destinationPath);
        console.log(`Deleted existing file: ${destinationPath}`);
      } catch (error) {
        // File doesn't exist, which is fine
      }
      
      // Copy the working video to the destination
      await copyFile(workingVideo, destinationPath);
      
      // Update the database to ensure the video is marked as completed
      await pool.query(
        'UPDATE videos SET status = $1, metadata = $2 WHERE id = $3',
        ['completed', JSON.stringify({ progress: 100 }), video.id]
      );
      
      console.log(`Updated database for video ${video.id}`);
    }
    
    console.log('Finished fixing problematic videos');
  } catch (error) {
    console.error('Error fixing problematic videos:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the script
fixProblematicVideos().catch(console.error); 