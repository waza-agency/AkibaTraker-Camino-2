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
async function uploadToIPFS(filePath) {
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

    // Upload to Pinata
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
      throw new Error(`Failed to upload to IPFS: ${errorText}`);
    }

    const result = await response.json();
    console.log('Successfully uploaded to IPFS with hash:', result.IpfsHash);
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

// Main function to update video URLs to IPFS
async function updateVideoUrls() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Get all videos with local file paths
    const { rows } = await client.query(`
      SELECT id, output_url, metadata 
      FROM videos 
      WHERE status = 'completed' AND output_url LIKE '/%'
    `);

    console.log(`Found ${rows.length} videos with local file paths to update`);

    for (const video of rows) {
      try {
        // Get the full path to the video file
        const localPath = video.output_url;
        const fullPath = path.join(process.cwd(), 'public', localPath.replace(/^\//, ''));
        
        // Check if the file exists
        if (!fs.existsSync(fullPath)) {
          console.log(`Video file not found at ${fullPath}, skipping video ${video.id}`);
          continue;
        }
        
        // Check if the file is a real video (not a placeholder)
        const stats = fs.statSync(fullPath);
        if (stats.size < 10000) { // Less than 10KB is likely a placeholder
          console.log(`Video file at ${fullPath} is too small (${stats.size} bytes), skipping video ${video.id}`);
          continue;
        }

        // Upload the video to IPFS
        console.log(`Uploading video ${video.id} to IPFS...`);
        const ipfsUrl = await uploadToIPFS(fullPath);
        
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

    console.log('Finished updating video URLs to IPFS');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Closed database connection');
  }
}

// Run the main function
updateVideoUrls(); 