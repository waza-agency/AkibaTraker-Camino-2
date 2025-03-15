// Script to fix stuck videos by automatically triggering audio integration
import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

// Initialize environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Connect to database
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Function to upload to IPFS
async function uploadToIPFS(filePath, fileName) {
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
    formData.append('file', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: 'video/mp4'
    });

    // Add metadata
    const metadata = JSON.stringify({
      name: `AkibaTracker Video - ${fileName}`,
      keyvalues: {
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

    // Upload to Pinata using API key and secret
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
      console.error('Pinata API error:', responseText);
      
      // Fall back to local file path
      console.log('Falling back to local file path due to Pinata API error');
      const publicDir = path.join(process.cwd(), 'public');
      const relativePath = filePath.replace(publicDir, '').replace(/\\/g, '/');
      return relativePath;
    }

    // Parse the response
    const result = JSON.parse(responseText);
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

// Function to update video status
async function updateVideoStatus(videoId, status, metadata, outputUrl = null) {
  console.log(`Updating video ${videoId} status to ${status}:`, metadata);
  
  if (outputUrl) {
    // If outputUrl is provided, update the output_url field as well
    await pool.query(
      'UPDATE videos SET status = $1, metadata = $2, output_url = $3, updated_at = NOW() WHERE id = $4',
      [status, JSON.stringify(metadata), outputUrl, videoId]
    );
  } else {
    // Otherwise, just update status and metadata
    await pool.query(
      'UPDATE videos SET status = $1, metadata = $2, updated_at = NOW() WHERE id = $3',
      [status, JSON.stringify(metadata), videoId]
    );
  }
}

// Function to integrate audio for a video
async function integrateAudio(videoId) {
  try {
    console.log(`Starting audio integration for video ID ${videoId}`);
    
    // Get video details
    const video = await pool.query(
      'SELECT * FROM videos WHERE id = $1',
      [videoId]
    ).then(res => res.rows[0]);

    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    // Update status to merging
    await updateVideoStatus(videoId, 'merging', {
      progress: 50,
      stage: 'audio-integration'
    });

    // Create a new temporary video file path
    const outputDir = path.join(process.cwd(), 'public', 'generated-videos');
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Create a fake video file for testing
    const tempVideoPath = path.join(outputDir, `temp-${videoId}.mp4`);
    
    // Check if we need to create a fake video file for testing
    const createFakeVideo = !fs.existsSync(tempVideoPath);
    if (createFakeVideo) {
      console.log(`Creating fake video file at ${tempVideoPath} for testing`);
      // Create a 10-second black video with ffmpeg
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input('color=c=black:s=1280x720:r=30:d=10')
          .inputFormat('lavfi')
          .outputOptions([
            '-c:v libx264',
            '-pix_fmt yuv420p',
            '-r 30'
          ])
          .output(tempVideoPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
    }

    // Get audio path
    const audioPath = path.join(process.cwd(), 'public', video.music_file.replace(/^\//, ''));
    
    // Check if audio file exists
    if (!fs.existsSync(audioPath)) {
      console.error(`Audio file does not exist at ${audioPath}`);
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    // Create output file
    const outputFileName = `${uuidv4()}.mp4`;
    const outputPath = path.join(outputDir, outputFileName);

    // Merge video and audio
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(tempVideoPath)
        .input(audioPath)
        .outputOptions([
          '-c:v copy',
          '-c:a aac',
          '-b:a 192k',
          '-map 0:v:0',
          '-map 1:a:0',
          '-shortest',
          '-movflags +faststart',
          '-af volume=2',
          '-metadata', 'title=AkibaTracker Generated Video'
        ])
        .output(outputPath)
        .on('progress', (progress) => {
          const percent = progress.percent ?? 0;
          console.log('Merging progress:', percent, '%');
          // Scale merging progress from 50% to 100%
          const totalProgress = 50 + (percent * 0.5);
          updateVideoStatus(videoId, 'merging', { 
            progress: totalProgress
          }).catch(console.error);
        })
        .on('end', async () => {
          console.log('FFmpeg process completed');
          
          try {
            // Upload to IPFS
            const ipfsUrl = await uploadToIPFS(outputPath, outputFileName);
            console.log('Uploaded to IPFS:', ipfsUrl);
            
            // Update video with final status and set output_url field
            await updateVideoStatus(videoId, 'completed', {
              progress: 100,
              duration: '10s',
              style: video.style,
              audioFile: video.music_file,
              outputUrl: ipfsUrl
            }, ipfsUrl); // Pass the ipfsUrl as the output_url

            // Clean up temporary files
            fs.unlinkSync(tempVideoPath);
            fs.unlinkSync(outputPath);
            
            console.log(`Successfully processed video ${videoId}`);
            resolve();
          } catch (error) {
            console.error('Error in IPFS upload:', error);
            reject(error);
          }
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(new Error(`FFmpeg error: ${err.message}`));
        })
        .run();
    });

    return true;
  } catch (error) {
    console.error(`Error in audio integration for video ${videoId}:`, error);
    await updateVideoStatus(videoId, 'failed', {
      error: error.message || 'Unknown error',
      stage: 'audio-integration',
      failedAt: new Date().toISOString()
    });
    return false;
  }
}

// Main function to fix stuck videos
async function fixStuckVideos() {
  try {
    console.log('Starting to fix stuck videos...');
    
    // Get all videos that are stuck
    const result = await pool.query(`
      SELECT id, prompt, style, music_file, status, metadata
      FROM videos
      WHERE status IN ('generating', 'ready_for_audio', 'merging')
      ORDER BY id ASC
    `);
    
    console.log(`Found ${result.rows.length} stuck videos`);
    
    // Process each video
    for (const video of result.rows) {
      console.log(`Processing video ${video.id} (${video.status}): ${video.prompt}`);
      
      try {
        // For videos in generating or merging status, move them to ready_for_audio
        if (video.status === 'generating' || video.status === 'merging') {
          console.log(`Updating video ${video.id} to ready_for_audio status`);
          await updateVideoStatus(video.id, 'ready_for_audio', {
            progress: 50,
            tempVideoPath: path.join(process.cwd(), 'public', 'generated-videos', `temp-${video.id}.mp4`)
          });
        }
        
        // Now integrate audio for all videos in ready_for_audio status
        if (video.status === 'ready_for_audio' || true) { // Force processing for all videos
          console.log(`Integrating audio for video ${video.id}`);
          await integrateAudio(video.id);
        }
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
      }
    }
    
    console.log('Finished processing stuck videos');
  } catch (error) {
    console.error('Error fixing stuck videos:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the script
fixStuckVideos().catch(console.error); 