import { Router } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const router = Router();

// Ensure output directory exists
const outputDir = path.join(process.cwd(), 'public', 'trimmed-audio');
fs.mkdir(outputDir, { recursive: true }).catch(console.error);

interface TrimRequest {
  sourceUrl: string;
  startTime: number;
  endTime: number;
}

// Helper function to convert IPFS URL to Gateway URL
function getGatewayUrl(ipfsUrl: string): string {
  console.log('Converting URL:', ipfsUrl);
  
  if (ipfsUrl.startsWith('http')) {
    // Use cloudflare gateway instead of ipfs.io for better reliability
    if (ipfsUrl.includes('ipfs.io')) {
      const newUrl = ipfsUrl.replace('ipfs.io', 'cloudflare-ipfs.com');
      console.log('Using Cloudflare gateway:', newUrl);
      return newUrl;
    }
    console.log('Using direct HTTP URL:', ipfsUrl);
    return ipfsUrl;
  }
  
  if (ipfsUrl.startsWith('ipfs://')) {
    const cid = ipfsUrl.replace('ipfs://', '');
    const gatewayUrl = `https://cloudflare-ipfs.com/ipfs/${cid}`;
    console.log('Converted IPFS URL:', ipfsUrl, 'to:', gatewayUrl);
    return gatewayUrl;
  }
  
  const cid = ipfsUrl.replace('/ipfs/', '');
  const gatewayUrl = `https://cloudflare-ipfs.com/ipfs/${cid}`;
  console.log('Converted CID/path:', ipfsUrl, 'to:', gatewayUrl);
  return gatewayUrl;
}

router.post('/trim', async (req, res) => {
  try {
    const { sourceUrl, startTime, endTime }: TrimRequest = req.body;

    // Validate input parameters
    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return res.status(400).json({ error: 'Invalid source URL' });
    }

    if (typeof startTime !== 'number' || startTime < 0) {
      return res.status(400).json({ error: 'Invalid start time' });
    }

    if (typeof endTime !== 'number' || endTime <= startTime) {
      return res.status(400).json({ error: 'Invalid end time' });
    }

    // Generate unique filename
    const outputFileName = `${uuidv4()}.mp3`;
    const outputPath = path.join(outputDir, outputFileName);
    const tempPath = path.join(outputDir, `temp-${outputFileName}`);

    try {
      // Download the source audio from IPFS
      const gatewayUrl = getGatewayUrl(sourceUrl);
      console.log('Attempting to download from:', gatewayUrl);
      
      const response = await fetch(gatewayUrl, {
        headers: {
          'User-Agent': 'AkibaTracker/1.0',
          'Accept': 'audio/*'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch source audio: ${response.statusText} (${response.status})`);
      }

      const body = response.body;
      if (!body) {
        throw new Error('Response body is null');
      }

      // Create temporary file for downloaded audio
      const fileStream = createWriteStream(tempPath);
      await new Promise((resolve, reject) => {
        body.pipe(fileStream)
          .on('finish', resolve)
          .on('error', reject);
      });

      console.log('Audio downloaded successfully to:', tempPath);

      // Trim the audio
      await new Promise((resolve, reject) => {
        ffmpeg(tempPath)
          .setStartTime(startTime)
          .setDuration(10) // Always trim to 10 seconds
          .audioCodec('libmp3lame')
          .audioBitrate('192k')
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('Processing: ' + progress.percent + '% done');
          })
          .on('end', () => {
            console.log('Audio trimming completed successfully');
            resolve(null);
          })
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(new Error(`FFmpeg error: ${err.message}`));
          })
          .run();
      });

      // Clean up temp file
      await fs.unlink(tempPath);

      // Return the URL for the trimmed audio
      const trimmedAudioUrl = `/trimmed-audio/${outputFileName}`;
      res.json({ 
        trimmedAudioUrl,
        message: 'Audio trimmed successfully'
      });

    } catch (error) {
      // Clean up any temporary files if they exist
      try {
        await fs.access(tempPath);
        await fs.unlink(tempPath);
      } catch {} // Ignore errors if file doesn't exist

      throw error; // Re-throw to be caught by outer catch block
    }

  } catch (error) {
    console.error('Error trimming audio:', error);
    res.status(500).json({ 
      error: 'Failed to trim audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 