// Script to fix video files by ensuring they have the correct MIME type and headers
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Initialize environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to check if ffmpeg is installed
function checkFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error('FFmpeg is not installed or not in PATH. Please install FFmpeg to continue.');
    return false;
  }
}

// Function to fix video file headers
async function fixVideoFile(inputPath, outputPath) {
  try {
    console.log(`Fixing video file: ${inputPath}`);
    
    // Create a temporary output path if not provided
    if (!outputPath) {
      outputPath = inputPath + '.fixed.mp4';
    }
    
    // Use ffmpeg to remux the video with proper headers
    const command = `ffmpeg -i "${inputPath}" -c copy -movflags faststart "${outputPath}"`;
    console.log(`Running command: ${command}`);
    
    execSync(command, { stdio: 'inherit' });
    
    // Replace the original file with the fixed one
    if (outputPath !== inputPath) {
      await fs.promises.rename(outputPath, inputPath);
      console.log(`Replaced original file with fixed version`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error fixing video file: ${error.message}`);
    return false;
  }
}

// Function to fix all video files in a directory
async function fixAllVideos() {
  try {
    console.log('Starting to fix video files...');
    
    // Check if ffmpeg is installed
    if (!checkFfmpeg()) {
      return;
    }
    
    // Define the directory where videos are stored
    const generatedVideosDir = path.join(process.cwd(), 'public', 'generated-videos');
    console.log(`Video directory: ${generatedVideosDir}`);
    
    // Create the directory if it doesn't exist
    await fs.promises.mkdir(generatedVideosDir, { recursive: true });
    
    // Get all existing video files
    const files = await fs.promises.readdir(generatedVideosDir);
    console.log(`Found ${files.length} files in directory`);
    
    // Filter for video files
    const videoFiles = files.filter(file => file.endsWith('.mp4'));
    console.log(`Found ${videoFiles.length} video files`);
    
    // Process each video file
    let fixedCount = 0;
    for (const file of videoFiles) {
      const filePath = path.join(generatedVideosDir, file);
      
      // Check file size
      const stats = await fs.promises.stat(filePath);
      if (stats.size < 1000000) { // Less than 1MB
        console.log(`Skipping small file (${stats.size} bytes): ${file}`);
        continue;
      }
      
      // Fix the video file
      const success = await fixVideoFile(filePath);
      if (success) {
        fixedCount++;
      }
    }
    
    console.log(`Fixed ${fixedCount} video files`);
    
    // Specifically fix the two problematic videos
    const problematicVideos = [
      '648ab2ea-cc74-41b0-9906-976430108534.mp4', // Video 17
      '4abe06f8-22e1-4f3c-8b66-fe236f7c4a9f.mp4'  // Video 18
    ];
    
    for (const file of problematicVideos) {
      const filePath = path.join(generatedVideosDir, file);
      
      // Check if the file exists
      try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        console.log(`Fixing problematic video: ${file}`);
        await fixVideoFile(filePath);
      } catch (error) {
        console.log(`Problematic video not found: ${file}`);
      }
    }
    
    console.log('Finished fixing video files');
  } catch (error) {
    console.error('Error fixing videos:', error);
  }
}

// Run the script
fixAllVideos().catch(console.error); 