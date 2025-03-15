import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Initialize environment variables
dotenv.config();

// Database connection
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

// Function to upload to IPFS
async function uploadToIPFS(filePath, videoId, prompt) {
  console.log(`Uploading ${filePath} to IPFS...`);
  
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET) {
    throw new Error('Pinata API credentials are not set');
  }

  try {
    // Create form data
    const formData = new FormData();
    const fileName = path.basename(filePath);
    
    formData.append('file', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: 'video/mp4'
    });

    // Add metadata
    const metadata = JSON.stringify({
      name: `AkibaTracker Video ${videoId} - ${prompt}`,
      keyvalues: {
        videoId: videoId.toString(),
        prompt: prompt,
        source: 'AkibaTracker',
        type: 'video/mp4',
        timestamp: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Add options
    const options = JSON.stringify({
      cidVersion: 0
    });
    formData.append('pinataOptions', options);

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET
      },
      body: formData
    });

    // Get response as text first for better error handling
    const responseText = await response.text();
    console.log('Pinata API response:', responseText);

    if (!response.ok) {
      throw new Error(`Failed to upload to IPFS: ${responseText}`);
    }

    // Parse the response
    const result = JSON.parse(responseText);
    console.log('Successfully uploaded to IPFS with hash:', result.IpfsHash);
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

// Function to test authentication
async function testAuthentication() {
  console.log('Testing Pinata API authentication...');
  
  try {
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET
      }
    });

    const responseText = await response.text();
    console.log('Authentication response:', responseText);

    if (!response.ok) {
      throw new Error(`Authentication failed: ${responseText}`);
    }

    console.log('Authentication successful!');
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}

// Main function to upload videos to IPFS
async function uploadVideosToIPFS() {
  try {
    // Test authentication first
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      console.error('Authentication failed, please check your Pinata API credentials');
      return;
    }

    await client.connect();
    console.log('Connected to database');

    // Get all completed videos
    const { rows } = await client.query(`
      SELECT id, prompt, status, output_url, metadata, music_file
      FROM videos 
      WHERE status = 'completed'
      ORDER BY id ASC
    `);

    console.log(`Found ${rows.length} completed videos to upload to IPFS`);
    
    // Process each video
    for (const video of rows) {
      try {
        // Check if the video already has an IPFS URL
        if (video.output_url && video.output_url.startsWith('ipfs://')) {
          console.log(`Video ${video.id} already has an IPFS URL: ${video.output_url}, skipping`);
          continue;
        }
        
        // Get the full path to the video file
        const localPath = video.output_url;
        const fullPath = path.join(process.cwd(), 'public', localPath.replace(/^\//, ''));
        
        // Check if the file exists
        if (!fs.existsSync(fullPath)) {
          console.log(`Video file not found at ${fullPath}, skipping video ${video.id}`);
          continue;
        }
        
        // Upload the video to IPFS
        console.log(`Uploading video ${video.id} to IPFS...`);
        const ipfsUrl = await uploadToIPFS(fullPath, video.id, video.prompt);
        
        // Update the database with the new IPFS URL
        const metadata = video.metadata || {};
        metadata.outputUrl = ipfsUrl;
        
        await client.query(`
          UPDATE videos 
          SET output_url = $1, metadata = $2
          WHERE id = $3
        `, [ipfsUrl, metadata, video.id]);
        
        console.log(`Updated video ${video.id} with IPFS URL: ${ipfsUrl}`);
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
      }
    }

    console.log('Finished uploading videos to IPFS');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Closed database connection');
  }
}

// Run the main function
uploadVideosToIPFS(); 