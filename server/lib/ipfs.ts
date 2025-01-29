import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

const PINATA_API_URL = 'https://api.pinata.cloud';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function uploadToIPFS(filePath: string, fileName: string): Promise<string> {
  if (!process.env.PINATA_JWT) {
    throw new Error('PINATA_JWT environment variable is not set');
  }

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: 'video/mp4'
    });

    // Upload to Pinata
    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload to IPFS: ${error}`);
    }

    const result = await response.json() as PinataResponse;
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

export function getGatewayUrl(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('http')) {
    return ipfsUrl;
  }
  
  if (ipfsUrl.startsWith('ipfs://')) {
    const cid = ipfsUrl.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${cid}`;
  }
  
  const cid = ipfsUrl.replace('/ipfs/', '');
  return `https://ipfs.io/ipfs/${cid}`;
} 
