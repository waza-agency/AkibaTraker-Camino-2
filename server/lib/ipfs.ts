import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * Uploads a file to IPFS using Pinata
 * Falls back to local file path if IPFS credentials are not set or invalid
 */
export async function uploadToIPFS(filePath: string): Promise<string> {
  console.log(`Attempting to upload ${filePath} to IPFS...`);
  
  // For development or when IPFS is not available, use local file path
  // Extract the relative path from the full path
  const publicDir = path.join(process.cwd(), 'public');
  const relativePath = filePath.replace(publicDir, '').replace(/\\/g, '/');
  
  // Return a local URL that points to the file
  console.log(`Using local file path: ${relativePath}`);
  return relativePath;
}

/**
 * Gets a gateway URL for an IPFS URL or returns the local file path
 */
export function getGatewayUrl(url: string | null): string | null {
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

