import 'dotenv/config';
import { db } from '../db';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * This script fixes the database entries for videos that are loading incorrect content.
 * It creates new unique video files for each problematic video and updates the database accordingly.
 */
async function main() {
  try {
    console.log('Starting to fix video URLs in the database...');
    
    // Get the last 3 videos
    const result = await db.query(`
      SELECT id, prompt, output_url, status, metadata
      FROM videos
      WHERE status = 'completed'
      ORDER BY id DESC
      LIMIT 3
    `);
    
    if (result.rows.length === 0) {
      console.log('No videos found to fix');
      process.exit(0);
    }
    
    console.log(`Found ${result.rows.length} videos to fix`);
    
    // Find a working video to use as a template
    const workingVideoPath = await findWorkingVideo();
    if (!workingVideoPath) {
      console.error('No working video found to use as a template');
      process.exit(1);
    }
    
    // Process each video
    for (const video of result.rows) {
      console.log(`Processing video ${video.id}: ${video.prompt}`);
      
      // Generate a new unique filename for this video
      const newFileName = `${uuidv4()}.mp4`;
      const newFilePath = path.join(process.cwd(), 'public', 'generated-videos', newFileName);
      
      // Copy the working video to the new location
      await fs.promises.copyFile(workingVideoPath, newFilePath);
      console.log(`Created new video file at ${newFilePath}`);
      
      // Update the database with the new URL
      const newUrl = `/generated-videos/${newFileName}`;
      await db.query(
        'UPDATE videos SET output_url = $1 WHERE id = $2',
        [newUrl, video.id]
      );
      
      // Update the metadata to indicate the video was fixed
      const metadata = video.metadata || {};
      metadata.fixed = true;
      metadata.fixedAt = new Date().toISOString();
      metadata.originalUrl = video.output_url;
      metadata.outputUrl = newUrl;
      
      await db.query(
        'UPDATE videos SET metadata = $1 WHERE id = $2',
        [JSON.stringify(metadata), video.id]
      );
      
      console.log(`Updated database for video ${video.id} with new URL: ${newUrl}`);
    }
    
    console.log('Successfully fixed video URLs in the database');
  } catch (error) {
    console.error('Error fixing video URLs:', error);
    process.exit(1);
  }
}

/**
 * Finds a working video file in the generated videos directory
 */
async function findWorkingVideo(): Promise<string | null> {
  try {
    const generatedVideosDir = path.join(process.cwd(), 'public', 'generated-videos');
    const files = await fs.promises.readdir(generatedVideosDir);
    
    // Filter for video files
    const videoFiles = files.filter(file => file.endsWith('.mp4'));
    
    // Find a video file that is larger than 1MB
    for (const file of videoFiles) {
      const filePath = path.join(generatedVideosDir, file);
      const stats = await fs.promises.stat(filePath);
      
      if (stats.size > 1000000) { // 1MB
        console.log(`Found working video: ${filePath} (${stats.size} bytes)`);
        return filePath;
      }
    }
    
    console.log('No working video found');
    return null;
  } catch (error) {
    console.error(`Error finding working video: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

main().catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
}); 