// Script to fix video URLs to use local file paths instead of IPFS URLs
import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Initialize environment variables
dotenv.config();

// Database connection
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

// Function to upload to IPFS with fallback to local path
async function uploadToIPFS(filePath) {
  console.log(`Attempting to upload ${filePath} to IPFS...`);
  
  // Check if we should use IPFS or local file path
  const useIpfs = process.env.USE_IPFS === 'true' && 
                  process.env.PINATA_API_KEY && 
                  process.env.PINATA_API_SECRET;
  
  if (!useIpfs) {
    console.log('Using local file path instead of IPFS (IPFS credentials not set or USE_IPFS not true)');
    // Extract the relative path from the full path
    const publicDir = path.join(process.cwd(), 'public');
    const relativePath = filePath.replace(publicDir, '').replace(/\\/g, '/');
    
    // Return a local URL that points to the file
    console.log(`Using local file path: ${relativePath}`);
    return relativePath;
  }
  
  try {
    // Create form data
    const formData = new FormData();
    const fileName = path.basename(filePath);
    
    formData.append('file', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: 'video/mp4'
    });

    // Upload to Pinata using API key and secret
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata API error:', errorText);
      
      // Fall back to local file path
      console.log('Falling back to local file path due to Pinata API error');
      const publicDir = path.join(process.cwd(), 'public');
      const relativePath = filePath.replace(publicDir, '').replace(/\\/g, '/');
      return relativePath;
    }

    const result = await response.json();
    console.log('Successfully uploaded to IPFS with hash:', result.IpfsHash);
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    
    // Fall back to local file path
    console.log('Falling back to local file path due to error');
    const publicDir = path.join(process.cwd(), 'public');
    const relativePath = filePath.replace(publicDir, '').replace(/\\/g, '/');
    return relativePath;
  }
}

// Function to get gateway URL from IPFS URL
function getGatewayUrl(url) {
  if (!url) return null;
  
  // Handle IPFS URLs
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
  
  // Handle local file paths
  if (url.startsWith('/')) {
    return url; // Already a relative path
  }
  
  return url;
}

// Main function to fix video URLs
async function fixVideoUrls() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Get all videos with IPFS URLs
    const { rows } = await client.query(`
      SELECT id, output_url, metadata 
      FROM videos 
      WHERE status = 'completed'
    `);

    console.log(`Found ${rows.length} videos to check`);

    for (const video of rows) {
      try {
        // Check if we have a real video file to upload
        const generatedVideosDir = path.join(process.cwd(), 'public', 'generated-videos');
        const existingFiles = fs.readdirSync(generatedVideosDir);
        
        // Find a real video file (larger than 10KB)
        let realVideoFile = null;
        for (const file of existingFiles) {
          const filePath = path.join(generatedVideosDir, file);
          const stats = fs.statSync(filePath);
          if (stats.size > 10000) { // More than 10KB is likely a real video
            realVideoFile = filePath;
            break;
          }
        }

        if (!realVideoFile) {
          console.log(`No real video file found for video ${video.id}, skipping`);
          continue;
        }

        // Upload the real video to IPFS or get local path
        const localUrl = await uploadToIPFS(realVideoFile);
        
        // Update the database with the new URL
        const metadata = video.metadata || {};
        metadata.outputUrl = localUrl;
        
        await client.query(`
          UPDATE videos 
          SET output_url = $1, metadata = $2
          WHERE id = $3
        `, [localUrl, metadata, video.id]);
        
        console.log(`Updated video ${video.id} with URL: ${localUrl}`);
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
      }
    }

    console.log('Finished fixing video URLs');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Closed database connection');
  }
}

// Run the main function
fixVideoUrls(); 