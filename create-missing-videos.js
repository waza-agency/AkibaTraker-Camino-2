// Script to create missing video files by copying existing ones
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Function to check if a file is a valid video (larger than 1MB)
async function isValidVideo(filePath) {
  try {
    const stats = await fs.promises.stat(filePath);
    console.log(`File ${filePath} size: ${stats.size} bytes`);
    return stats.size > 1000000; // 1MB
  } catch (error) {
    console.log(`File ${filePath} does not exist`);
    return false;
  }
}

// Function to create missing video files
async function createMissingVideos() {
  try {
    console.log('Starting to create missing video files...');
    
    // Define the directory where videos are stored
    const generatedVideosDir = path.join(process.cwd(), 'public', 'generated-videos');
    console.log(`Video directory: ${generatedVideosDir}`);
    
    // Create the directory if it doesn't exist
    await fs.promises.mkdir(generatedVideosDir, { recursive: true });
    
    // Get all existing video files
    const files = await fs.promises.readdir(generatedVideosDir);
    console.log(`All files in directory: ${files.join(', ')}`);
    
    // Filter for actual video files (mp4) that are valid (larger than 1MB)
    const videoFiles = [];
    for (const file of files) {
      if (file.endsWith('.mp4')) {
        const filePath = path.join(generatedVideosDir, file);
        const isValid = await isValidVideo(filePath);
        console.log(`File ${file} is ${isValid ? 'valid' : 'invalid'}`);
        if (isValid) {
          videoFiles.push(file);
        }
      }
    }
    
    if (videoFiles.length === 0) {
      console.log('No valid existing video files found to copy from');
      return;
    }
    
    console.log(`Found ${videoFiles.length} valid existing video files: ${videoFiles.join(', ')}`);
    
    // Define the missing video files we need to create
    const missingVideos = [
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
    
    // Create each missing video by copying an existing one
    for (const missingVideo of missingVideos) {
      const destinationPath = path.join(generatedVideosDir, missingVideo.filename);
      console.log(`Checking destination path: ${destinationPath}`);
      
      // Check if the file already exists and is valid
      const isValid = await isValidVideo(destinationPath);
      
      if (isValid) {
        console.log(`Valid video already exists at ${destinationPath}, skipping`);
        continue;
      }
      
      // If file exists but is invalid, delete it
      try {
        await fs.promises.unlink(destinationPath);
        console.log(`Deleted invalid video at ${destinationPath}`);
      } catch (error) {
        console.log(`No need to delete ${destinationPath}, it doesn't exist or can't be deleted: ${error.message}`);
      }
      
      // Pick a random existing video to copy
      const randomIndex = Math.floor(Math.random() * videoFiles.length);
      const sourcePath = path.join(generatedVideosDir, videoFiles[randomIndex]);
      
      console.log(`Creating video for "${missingVideo.description}" (ID: ${missingVideo.id})`);
      console.log(`Copying from ${sourcePath} to ${destinationPath}`);
      await copyFile(sourcePath, destinationPath);
    }
    
    console.log('Finished creating missing video files');
  } catch (error) {
    console.error('Error creating missing videos:', error);
  }
}

// Run the script
createMissingVideos().catch(console.error); 