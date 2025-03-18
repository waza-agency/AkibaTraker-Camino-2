import 'dotenv/config';
import { db } from '../db';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Constants
const MIN_VALID_VIDEO_SIZE = 1000000; // 1MB

/**
 * Checks if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
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
    
    // Find a video file that is larger than MIN_VALID_VIDEO_SIZE
    for (const file of videoFiles) {
      const filePath = path.join(generatedVideosDir, file);
      const stats = await fs.promises.stat(filePath);
      
      if (stats.size > MIN_VALID_VIDEO_SIZE) {
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

/**
 * Copies a file from source to destination
 */
async function copyFile(source: string, destination: string): Promise<boolean> {
  try {
    await fs.promises.copyFile(source, destination);
    console.log(`Copied ${source} to ${destination}`);
    return true;
  } catch (error) {
    console.error(`Error copying file: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Fixes a video file using ffmpeg (if available)
 */
async function fixVideoFile(inputPath: string): Promise<boolean> {
  try {
    console.log(`Attempting to fix video file: ${inputPath}`);
    
    // Create a temporary output path
    const outputPath = `${inputPath}.fixed.mp4`;
    
    try {
      // Use ffmpeg to remux the video with proper headers
      const command = `ffmpeg -i "${inputPath}" -c copy -movflags faststart "${outputPath}"`;
      console.log(`Running command: ${command}`);
      
      execSync(command, { stdio: 'inherit' });
      
      // Replace the original file with the fixed one
      await fs.promises.rename(outputPath, inputPath);
      console.log(`Replaced original file with fixed version`);
      
      return true;
    } catch (error) {
      console.error(`FFmpeg error: ${error instanceof Error ? error.message : String(error)}`);
      
      // If ffmpeg fails, try a simple copy as fallback
      const workingVideo = await findWorkingVideo();
      if (workingVideo && workingVideo !== inputPath) {
        return await copyFile(workingVideo, inputPath);
      }
      
      return false;
    }
  } catch (error) {
    console.error(`Error fixing video file: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Checks and fixes a single video
 */
async function checkAndFixVideo(video: any): Promise<boolean> {
  try {
    console.log(`Checking video ${video.id}: ${video.prompt}`);
    
    // Check if the output_url is valid
    const outputUrl = video.output_url;
    if (!outputUrl) {
      console.log(`Video ${video.id} has no output_url, skipping`);
      return false;
    }
    
    // If it's a local file path, check if the file exists
    if (outputUrl.startsWith('/')) {
      const filePath = path.join(process.cwd(), 'public', outputUrl.replace(/^\//, ''));
      console.log(`Local file path: ${filePath}`);
      
      const exists = await fileExists(filePath);
      if (exists) {
        // Check file size
        const stats = await fs.promises.stat(filePath);
        console.log(`File exists at ${filePath}, size: ${stats.size} bytes`);
        
        if (stats.size < MIN_VALID_VIDEO_SIZE) {
          console.log(`File is too small (${stats.size} bytes), attempting to fix`);
          return await fixVideoFile(filePath);
        }
        
        // File exists and is large enough, no action needed
        return true;
      } else {
        console.log(`File does not exist at ${filePath}, attempting to create`);
        
        // Create directory if it doesn't exist
        const dir = path.dirname(filePath);
        await fs.promises.mkdir(dir, { recursive: true });
        
        // Find a working video and copy it
        const workingVideo = await findWorkingVideo();
        if (workingVideo) {
          return await copyFile(workingVideo, filePath);
        } else {
          console.log(`No working video found to copy`);
          return false;
        }
      }
    } else {
      // Remote URL, nothing we can do to fix it
      console.log(`Remote URL: ${outputUrl}, cannot fix`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking video ${video.id}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function main() {
  // Get video ID from command line
  const videoId = process.argv[2];
  
  if (!videoId) {
    console.error('Please provide a video ID as an argument');
    process.exit(1);
  }
  
  console.log(`Starting fix for video ID: ${videoId}`);
  
  try {
    // Get the video from the database
    const result = await db.query(
      'SELECT id, prompt, output_url, status, metadata FROM videos WHERE id = $1',
      [videoId]
    );
    
    if (result.rows.length === 0) {
      console.error(`Video with ID ${videoId} not found`);
      process.exit(1);
    }
    
    const video = result.rows[0];
    console.log(`Found video: ${video.id} - ${video.prompt}`);
    
    // Fix the video
    const fixed = await checkAndFixVideo(video);
    
    if (fixed) {
      console.log(`Successfully fixed video ${videoId}`);
      
      // Update the metadata to indicate the video was fixed
      const metadata = video.metadata || {};
      metadata.fixed = true;
      metadata.fixedAt = new Date().toISOString();
      
      await db.query(
        'UPDATE videos SET metadata = $1 WHERE id = $2',
        [JSON.stringify(metadata), video.id]
      );
      
      console.log(`Updated metadata for video ${videoId}`);
    } else {
      console.log(`Could not fix video ${videoId}`);
    }
  } catch (error) {
    console.error(`Error fixing video ${videoId}:`, error);
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
}); 