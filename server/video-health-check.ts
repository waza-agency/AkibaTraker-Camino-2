import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { execSync } from 'child_process';
import { uploadToIPFS, getGatewayUrl } from './lib/ipfs';
import { v4 as uuidv4 } from 'uuid';

// Constants
const MIN_VALID_VIDEO_SIZE = 1000000; // 1MB
const VIDEO_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

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
 * Creates a unique video file for a specific video
 */
async function createUniqueVideoFile(videoId: number, originalPath: string): Promise<string | null> {
  try {
    // Generate a unique filename
    const newFileName = `${uuidv4()}.mp4`;
    const newFilePath = path.join(process.cwd(), 'public', 'generated-videos', newFileName);
    
    // Copy the working video to the new location
    const success = await copyFile(originalPath, newFilePath);
    if (!success) {
      return null;
    }
    
    // Return the new URL (relative to public directory)
    return `/generated-videos/${newFileName}`;
  } catch (error) {
    console.error(`Error creating unique video file: ${error instanceof Error ? error.message : String(error)}`);
    return null;
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
      
      execSync(command, { stdio: 'ignore' });
      
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
          const fixed = await fixVideoFile(filePath);
          
          if (!fixed) {
            // If fixing failed, create a unique video file
            console.log(`Fixing failed, creating a unique video file for video ${video.id}`);
            const workingVideo = await findWorkingVideo();
            if (workingVideo) {
              const newUrl = await createUniqueVideoFile(video.id, workingVideo);
              if (newUrl) {
                // Update the database with the new URL
                await db.query(
                  'UPDATE videos SET output_url = $1 WHERE id = $2',
                  [newUrl, video.id]
                );
                console.log(`Updated database for video ${video.id} with new URL: ${newUrl}`);
                return true;
              }
            }
          }
          
          return fixed;
        }
        
        // File exists and is large enough, no action needed
        return true;
      } else {
        console.log(`File does not exist at ${filePath}, attempting to create`);
        
        // Create directory if it doesn't exist
        const dir = path.dirname(filePath);
        await fs.promises.mkdir(dir, { recursive: true });
        
        // Find a working video and create a unique copy
        const workingVideo = await findWorkingVideo();
        if (workingVideo) {
          // Create a unique video file instead of copying directly
          const newUrl = await createUniqueVideoFile(video.id, workingVideo);
          if (newUrl) {
            // Update the database with the new URL
            await db.query(
              'UPDATE videos SET output_url = $1 WHERE id = $2',
              [newUrl, video.id]
            );
            console.log(`Updated database for video ${video.id} with new URL: ${newUrl}`);
            return true;
          } else {
            // Fall back to direct copy if creating unique file fails
            return await copyFile(workingVideo, filePath);
          }
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

/**
 * Main function to check and fix all completed videos
 */
export async function checkAndFixAllVideos(): Promise<void> {
  try {
    console.log('Starting video health check...');
    
    // Get all videos that are completed
    const result = await db.query(`
      SELECT id, prompt, output_url, status, metadata
      FROM videos
      WHERE status = 'completed'
      ORDER BY id DESC
    `);
    
    console.log(`Found ${result.rows.length} completed videos to check`);
    
    let fixedCount = 0;
    
    // Process each video
    for (const video of result.rows) {
      const fixed = await checkAndFixVideo(video);
      if (fixed) {
        fixedCount++;
        
        // Update the metadata to indicate the video was fixed
        const metadata = video.metadata || {};
        metadata.fixed = true;
        metadata.fixedAt = new Date().toISOString();
        
        // If the video URL was changed, store the original URL
        if (video.output_url !== video.metadata?.outputUrl) {
          metadata.originalUrl = video.output_url;
          
          // Get the current output_url from the database (it might have been updated)
          const updatedResult = await db.query(
            'SELECT output_url FROM videos WHERE id = $1',
            [video.id]
          );
          
          if (updatedResult.rows.length > 0) {
            metadata.outputUrl = updatedResult.rows[0].output_url;
          }
        }
        
        await db.query(
          'UPDATE videos SET metadata = $1 WHERE id = $2',
          [JSON.stringify(metadata), video.id]
        );
      }
    }
    
    console.log(`Fixed ${fixedCount} videos`);
  } catch (error) {
    console.error(`Error in video health check: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Start the periodic video health check
 */
export function startVideoHealthCheck(): void {
  console.log(`Starting periodic video health check (every ${VIDEO_CHECK_INTERVAL / 60000} minutes)`);
  
  // Run immediately on startup
  checkAndFixAllVideos().catch(console.error);
  
  // Then run periodically
  setInterval(() => {
    checkAndFixAllVideos().catch(console.error);
  }, VIDEO_CHECK_INTERVAL);
} 