import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Initialize environment variables
dotenv.config();

// Function to create a test file
async function createTestFile() {
  const testDir = path.join(process.cwd(), 'test-files');
  fs.mkdirSync(testDir, { recursive: true });
  
  const testFilePath = path.join(testDir, 'test-video.mp4');
  
  // Create a small test file (1MB of random data)
  const buffer = Buffer.alloc(1024 * 1024);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  
  fs.writeFileSync(testFilePath, buffer);
  console.log(`Created test file at ${testFilePath}`);
  
  return testFilePath;
}

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

    const responseText = await response.text();
    console.log('Pinata API response:', responseText);

    if (!response.ok) {
      throw new Error(`Failed to upload to IPFS: ${responseText}`);
    }

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

// Main function
async function main() {
  try {
    // Test authentication first
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      console.error('Authentication failed, please check your Pinata API credentials');
      return;
    }
    
    // Create and upload test file
    const testFilePath = await createTestFile();
    const ipfsUrl = await uploadToIPFS(testFilePath);
    
    console.log('IPFS URL:', ipfsUrl);
    console.log('Gateway URL:', `https://gateway.pinata.cloud/ipfs/${ipfsUrl.replace('ipfs://', '')}`);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    console.log(`Deleted test file: ${testFilePath}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main(); 