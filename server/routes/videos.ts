import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { generateVideo } from '../../client/src/lib/fal-api';
import fs from 'fs';
import express, { Router } from 'express';
import { db } from '../../db';
import { requireAuth } from "../auth/middleware";
import { uploadToIPFS, getGatewayUrl } from '../lib/ipfs';

const router = Router();

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Log all requests for debugging
router.use((req, res, next) => {
  console.log('Videos route:', req.method, req.url);
  next();
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { prompt, style, music } = req.body;
    const userId = req.user!.id;
    console.log('Received video generation request:', { prompt, style, musicUrl: music, userId });

    // Create database entry
    const result = await db.query(
      `INSERT INTO videos (prompt, style, music_file, status, metadata, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [prompt, style, music, 'pending', JSON.stringify({ progress: 0 }), userId]
    );
    const video = result.rows[0];

    // Start video generation in the background
    generateFalVideo(video.id, prompt).catch(error => {
      console.error('Background video generation failed:', error);
      updateVideoStatus(video.id, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }).catch(console.error);
    });

    res.status(200).json({
      id: video.id,
      status: 'pending',
      message: 'Video generation started'
    });

  } catch (error) {
    console.error('Error initiating video creation:', error);
    res.status(500).json({ 
      error: 'Failed to initiate video creation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to update video status
async function updateVideoStatus(
  videoId: number, 
  status: string, 
  metadata: Record<string, any>
) {
  console.log(`Updating video ${videoId} status to ${status}:`, metadata);
  await db.query(
    'UPDATE videos SET status = $1, metadata = $2, updated_at = NOW() WHERE id = $3',
    [status, JSON.stringify(metadata), videoId]
  );
}

// Video generation function
async function generateFalVideo(videoId: number, prompt: string) {
  try {
    console.log(`Starting video generation for ID ${videoId} with prompt: ${prompt}`);
    await updateVideoStatus(videoId, 'generating', { progress: 0 });

    const result = await generateVideo(prompt, process.env.FAL_API_KEY!, async (status, progress) => {
      // Update progress in database based on FAL.ai status
      console.log(`Video ${videoId} generation status:`, status, 'Progress:', progress);
      let calculatedProgress = 0;
      
      switch (status) {
        case 'IN_PROGRESS':
          // FAL.ai progress goes from 0-95%, we'll scale it to 0-50%
          // The remaining 50% will be for audio integration
          calculatedProgress = Math.min((progress || 0) * 0.5, 50);
          break;
        case 'COMPLETED':
          calculatedProgress = 50; // Ready for audio integration
          break;
        case 'FAILED':
          throw new Error('Video generation failed');
      }
      
      await updateVideoStatus(videoId, 'generating', { 
        progress: calculatedProgress,
        generationStatus: status
      });
    });

    console.log(`Received video URL for ID ${videoId}:`, result);
    
    const outputDir = path.join(process.cwd(), 'public', 'generated-videos');
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    const tempVideoPath = path.join(outputDir, `temp-${videoId}.mp4`);
    console.log(`Downloading video to ${tempVideoPath}`);
    await downloadFile(result.url, tempVideoPath);
    
    await updateVideoStatus(videoId, 'ready_for_audio', { 
      progress: 50,
      tempVideoPath
    });

    console.log(`Video ${videoId} ready for audio integration`);
    
    // Automatically trigger audio integration
    try {
      console.log(`Automatically starting audio integration for video ${videoId}`);
      await integrateAudio(videoId);
    } catch (audioError) {
      console.error(`Error during automatic audio integration for video ${videoId}:`, audioError);
      // If audio integration fails, we'll update the status but not throw an error
      // This allows the video generation to be considered successful even if audio integration fails
      await updateVideoStatus(videoId, 'failed', { 
        error: audioError instanceof Error ? audioError.message : 'Unknown error during audio integration',
        stage: 'auto-audio-integration'
      });
    }

  } catch (error) {
    console.error(`Video generation failed for ID ${videoId}:`, error);
    await updateVideoStatus(videoId, 'failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

// Helper function to download files
async function downloadFile(url: string, outputPath: string): Promise<void> {
  console.log(`Downloading file from ${url} to ${outputPath}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    // Create a write stream
    const fileStream = fs.createWriteStream(outputPath);
    
    // Get the file as an array buffer and convert to Buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write the buffer to the file
    return new Promise((resolve, reject) => {
      fileStream.write(buffer, (error) => {
        if (error) {
          console.error('Error writing to file:', error);
          reject(error);
          return;
        }
        
        fileStream.end(() => {
          // Verify the file was created and has content
          fs.stat(outputPath, (err, stats) => {
            if (err) {
              console.error('Error checking file stats:', err);
              reject(err);
              return;
            }
            
            if (stats.size === 0) {
              console.error('Downloaded file is empty');
              reject(new Error('Downloaded file is empty'));
              return;
            }
            
            console.log(`File download completed: ${outputPath} (${stats.size} bytes)`);
            resolve();
          });
        });
      });
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

// Status endpoint
router.get("/:id/status", async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    console.log(`Checking status for video ${videoId}`);
    
    if (isNaN(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    const result = await db.query(
      'SELECT * FROM videos WHERE id = $1',
      [videoId]
    );
    const video = result.rows[0];

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const response = {
      id: video.id,
      status: video.status,
      progress: video.metadata?.progress || 0,
      outputUrl: video.output_url,
      error: video.metadata?.error
    };

    console.log(`Status for video ${videoId}:`, response);
    res.json(response);

  } catch (error) {
    console.error(`Error fetching status for video:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch video status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Audio integration endpoint
router.post("/:id/integrate-audio", async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    console.log(`Starting audio integration for video ${videoId}`);

    const result = await db.query(
      'SELECT * FROM videos WHERE id = $1',
      [videoId]
    );
    const video = result.rows[0];

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.status !== 'ready_for_audio') {
      return res.status(400).json({ error: 'Video not ready for audio integration' });
    }

    // Start audio integration process
    integrateAudio(videoId).catch(error => {
      console.error('Background audio integration failed:', error);
      updateVideoStatus(videoId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }).catch(console.error);
    });

    res.json({ message: 'Audio integration started' });
  } catch (error) {
    console.error('Error starting audio integration:', error);
    res.status(500).json({ error: 'Failed to start audio integration' });
  }
});

// Audio integration function
async function integrateAudio(videoId: number) {
  try {
    console.log(`Starting audio integration for video ID ${videoId}`);
    
    // Get video details
    const video = await db.query(
      'SELECT * FROM videos WHERE id = $1',
      [videoId]
    ).then(res => res.rows[0]);

    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    // Only proceed if the video is in the ready_for_audio state
    if (video.status !== 'ready_for_audio') {
      console.log(`Video ${videoId} is not ready for audio integration (status: ${video.status})`);
      return;
    }

    await updateVideoStatus(videoId, 'merging', {
      progress: 50,
      stage: 'audio-integration'
    });

    const { tempVideoPath } = video.metadata;
    
    // Check if the temporary video file exists
    let videoExists = false;
    try {
      await fs.promises.access(tempVideoPath, fs.constants.F_OK);
      videoExists = true;
      console.log(`Temporary video file exists at ${tempVideoPath}`);
    } catch (error) {
      console.log(`Temporary video file does not exist at ${tempVideoPath}`);
      
      // Try alternative paths (handle Windows/Linux path differences)
      const alternativePaths = [
        // Original path
        tempVideoPath,
        // Convert Windows path to Linux path
        tempVideoPath.replace(/\\/g, '/'),
        // Convert Linux path to Windows path
        tempVideoPath.replace(/\//g, '\\'),
        // Try with process.cwd()
        path.join(process.cwd(), 'public', 'generated-videos', `temp-${videoId}.mp4`),
        // Try with absolute path for Docker
        `/usr/src/app/public/generated-videos/temp-${videoId}.mp4`
      ];
      
      for (const altPath of alternativePaths) {
        try {
          await fs.promises.access(altPath, fs.constants.F_OK);
          console.log(`Found video file at alternative path: ${altPath}`);
          videoExists = true;
          // Update the tempVideoPath to the working path
          video.metadata.tempVideoPath = altPath;
          break;
        } catch (e) {
          // Continue to next path
        }
      }
    }

    if (!videoExists) {
      // If the video doesn't exist, we need to regenerate it
      console.log(`Temporary video file not found. Restarting video generation for ID ${videoId}`);
      await updateVideoStatus(videoId, 'pending', { 
        progress: 0,
        retryCount: (video.metadata?.retryCount || 0) + 1
      });
      
      // Start video generation again
      generateFalVideo(videoId, video.prompt);
      return;
    }

    const audioPath = path.join(process.cwd(), 'public', video.music_file.replace(/^\//, ''));
    const outputFileName = `${uuidv4()}.mp4`;
    const outputPath = path.join(process.cwd(), 'public', 'generated-videos', outputFileName);

    // Verify audio file exists
    try {
      await fs.promises.access(audioPath, fs.constants.F_OK);
      console.log(`Audio file exists at ${audioPath}`);
    } catch (error) {
      console.error(`Audio file does not exist at ${audioPath}`);
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(video.metadata.tempVideoPath) // Use the potentially updated path
        .input(audioPath)
        .outputOptions([
          '-c:v copy',           // Copy video stream without re-encoding
          '-c:a aac',            // Use AAC codec for audio
          '-b:a 192k',           // Audio bitrate
          '-map 0:v:0',          // Use first video stream from first input
          '-map 1:a:0',          // Use first audio stream from second input
          '-shortest',           // Match duration to shortest input
          '-movflags +faststart', // Enable fast start for web playback
          '-af volume=2',        // Increase audio volume slightly
          '-metadata', 'title=AkibaTracker Generated Video'  // Add metadata properly
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
            console.log('Uploading to IPFS...');
            const ipfsUrl = await uploadToIPFS(outputPath);
            console.log('Uploaded to IPFS:', ipfsUrl);
            
            // Update video with final status and set output_url field directly
            await db.query(
              'UPDATE videos SET status = $1, metadata = $2, output_url = $3, updated_at = NOW() WHERE id = $4',
              [
                'completed', 
                JSON.stringify({
                  progress: 100,
                  duration: video.metadata?.duration || '10s',
                  style: video.style,
                  audioFile: video.music_file,
                  outputUrl: ipfsUrl
                }), 
                ipfsUrl, 
                videoId
              ]
            );

            // Clean up temporary files
            await fs.promises.unlink(video.metadata.tempVideoPath).catch(console.error);
            await fs.promises.unlink(outputPath).catch(console.error);
            
            resolve(null);
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
  } catch (error) {
    console.error(`Error in audio integration for video ${videoId}:`, error);
    await updateVideoStatus(videoId, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stage: 'audio-integration',
      failedAt: new Date().toISOString()
    });
    throw error;
  }
}

// Video like/unlike endpoint
router.post("/:id/like", requireAuth, async (req, res) => {
  const videoId = parseInt(req.params.id);
  const userId = req.user!.id;

  try {
    const existingLike = await db.query(
      'SELECT * FROM video_likes WHERE video_id = $1 AND user_id = $2',
      [videoId, userId]
    );

    if (existingLike.rows[0]) {
      await db.query(
        'DELETE FROM video_likes WHERE id = $1',
        [existingLike.rows[0].id]
      );
      await db.query(
        'UPDATE videos SET likes_count = likes_count - 1 WHERE id = $1',
        [videoId]
      );
      return res.json({ liked: false });
    }

    await db.query(
      'INSERT INTO video_likes (video_id, user_id) VALUES ($1, $2)',
      [videoId, userId]
    );
    await db.query(
      'UPDATE videos SET likes_count = likes_count + 1 WHERE id = $1',
      [videoId]
    );

    res.json({ liked: true });
  } catch (error) {
    console.error("Failed to toggle like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// Get liked videos endpoint
router.get("/liked", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT v.* FROM videos v
       JOIN video_likes vl ON v.id = vl.video_id
       WHERE vl.user_id = $1`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Failed to get liked videos:", error);
    res.status(500).json({ error: "Failed to get liked videos" });
  }
});

// Get all videos endpoint with enhanced metadata
router.get("/", async (req, res) => {
  try {
    console.log('Fetching videos for gallery...');
    const result = await db.query(
      `SELECT 
        v.id,
        v.prompt,
        v.style,
        v.output_url as "videoUrl",
        v.music_file as "audioUrl",
        v.status,
        v.metadata,
        v.likes_count as "likesCount",
        v.created_at as "createdAt",
        u.username as "creatorName"
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      ORDER BY v.created_at DESC`
    );

    // Format the response for the gallery and convert IPFS URLs to gateway URLs
    const videos = result.rows
      .map(video => {
        console.log('Processing video:', video.id, video.status, video.videoUrl);
        return {
          id: video.id,
          prompt: video.prompt,
          style: video.style,
          videoUrl: video.videoUrl ? getGatewayUrl(video.videoUrl) : null,
          audioUrl: video.audioUrl,
          status: video.status,
          metadata: video.metadata,
          likesCount: video.likesCount,
          createdAt: video.createdAt,
          creatorName: video.creatorName || 'Anonymous'
        };
      });

    console.log('Sending videos to client:', videos.length);
    res.json(videos);
  } catch (error) {
    console.error("Failed to get videos:", error);
    res.status(500).json({ error: "Failed to get videos" });
  }
});

// Retry video generation endpoint
router.post("/:id/retry", async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    
    if (isNaN(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    const result = await db.query(
      'SELECT * FROM videos WHERE id = $1',
      [videoId]
    );
    const video = result.rows[0];

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Reset video status and start generation again
    await updateVideoStatus(videoId, 'pending', { 
      progress: 0,
      retryCount: (video.metadata?.retryCount || 0) + 1
    });

    // Start FAL.ai video generation
    generateFalVideo(videoId, video.prompt);

    res.json({ 
      message: 'Video generation restarted',
      id: videoId,
      status: 'pending'
    });

  } catch (error) {
    console.error('Error retrying video generation:', error);
    res.status(500).json({ 
      error: 'Failed to retry video generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cleanup corrupted videos
async function cleanupCorruptedVideos() {
  try {
    console.log('Starting video cleanup process');
    
    // Get all videos that might be corrupted
    const result = await db.query(`
      SELECT id, status, metadata, output_url, created_at
      FROM videos
      WHERE status IN ('pending', 'generating', 'failed', 'merging')
    `);

    const videosToDelete: number[] = [];
    const now = new Date();

    for (const video of result.rows) {
      const createdAt = new Date(video.created_at);
      const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      // Only delete videos that are truly stuck or failed
      if (
        // Videos stuck in generating/pending for more than 2 hours (increased timeout)
        ((['pending', 'generating', 'merging'].includes(video.status)) && ageInHours > 2) ||
        // Only failed videos that have been retried multiple times
        (video.status === 'failed' && video.metadata?.retryCount > 2)
      ) {
        videosToDelete.push(video.id);
        
        // Try to clean up any associated files
        if (video.output_url) {
          const filePath = path.join(process.cwd(), 'public', video.output_url.replace(/^\//, ''));
          try {
            await fs.promises.unlink(filePath);
            console.log(`Deleted file: ${filePath}`);
          } catch (err) {
            console.log(`File not found or already deleted: ${filePath}`);
          }
        }
        
        // Clean up temp files if they exist
        if (video.metadata?.tempVideoPath) {
          try {
            await fs.promises.unlink(video.metadata.tempVideoPath);
            console.log(`Deleted temp file: ${video.metadata.tempVideoPath}`);
          } catch (err) {
            console.log(`Temp file not found or already deleted: ${video.metadata.tempVideoPath}`);
          }
        }
      }
    }

    if (videosToDelete.length > 0) {
      // Delete all likes for these videos
      await db.query(
        'DELETE FROM video_likes WHERE video_id = ANY($1::int[])',
        [videosToDelete]
      );
      
      // Delete the videos from the database
      const deleteResult = await db.query(
        'DELETE FROM videos WHERE id = ANY($1::int[]) RETURNING id',
        [videosToDelete]
      );
      
      console.log(`Cleaned up ${deleteResult.rowCount} corrupted videos`);
      return deleteResult.rowCount;
    }

    console.log('No corrupted videos found to clean up');
    return 0;
  } catch (error) {
    console.error('Error during video cleanup:', error);
    throw error;
  }
}

// Cleanup endpoint
router.post("/cleanup", async (req, res) => {
  try {
    const deletedCount = await cleanupCorruptedVideos();
    res.json({ 
      message: `Successfully cleaned up ${deletedCount} corrupted videos`,
      deletedCount 
    });
  } catch (error) {
    console.error("Failed to cleanup videos:", error);
    res.status(500).json({ error: "Failed to cleanup videos" });
  }
});

// Retry stuck videos
async function retryStuckVideos() {
  try {
    console.log('Starting retry process for stuck videos');
    
    // Get videos that are stuck but not too old
    const result = await db.query(`
      SELECT id, prompt, status, metadata, created_at
      FROM videos
      WHERE status IN ('pending', 'generating', 'merging')
      AND created_at > NOW() - INTERVAL '2 hours'
    `);

    const retriedVideos: number[] = [];
    
    for (const video of result.rows) {
      try {
        // Reset video status and increment retry count
        await updateVideoStatus(video.id, 'pending', { 
          progress: 0,
          retryCount: (video.metadata?.retryCount || 0) + 1
        });

        // Restart video generation
        await generateFalVideo(video.id, video.prompt);
        
        retriedVideos.push(video.id);
      } catch (error) {
        console.error(`Failed to retry video ${video.id}:`, error);
      }
    }

    console.log(`Successfully retried ${retriedVideos.length} videos`);
    return retriedVideos.length;
  } catch (error) {
    console.error('Error retrying stuck videos:', error);
    throw error;
  }
}

// Retry endpoint
router.post("/retry-stuck", async (req, res) => {
  try {
    const retriedCount = await retryStuckVideos();
    res.json({ 
      message: `Successfully retried ${retriedCount} stuck videos`,
      retriedCount 
    });
  } catch (error) {
    console.error("Failed to retry stuck videos:", error);
    res.status(500).json({ error: "Failed to retry stuck videos" });
  }
});

// Export the router and the integrateAudio function
export { router as videosRouter, integrateAudio }; 