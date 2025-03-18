# Video Health Check System

This system automatically monitors and fixes issues with video files in the application. It addresses common problems such as missing files, corrupted videos, or improperly formatted video files.

## Features

- **Automatic Health Checks**: Runs periodically to ensure all videos are accessible and playable
- **Self-Healing**: Automatically fixes common issues with video files
- **Unique Video Files**: Creates unique video files for each video to prevent duplicates
- **Database Integration**: Updates metadata to track fixed videos
- **FFmpeg Integration**: Uses FFmpeg for proper video remuxing when available

## Components

### 1. Server-Side Health Check Service

The system includes a background service that runs on the server to periodically check and fix video issues:

- Located in `server/video-health-check.ts`
- Automatically starts when the server starts
- Checks videos every 5 minutes
- Logs all actions for monitoring

### 2. Manual Check Scripts

Several scripts are provided for manual intervention:

- **Check All Videos**: `npm run check-videos`
  - Scans all completed videos in the database
  - Fixes any issues found
  - Updates the database with fix information

- **Fix Specific Video**: `npm run fix-video <video_id>`
  - Targets a specific video by ID
  - Attempts to fix using FFmpeg first
  - Falls back to copying a working video if FFmpeg fails
  - Updates the database with fix information

- **Fix Video URLs**: `npm run fix-video-urls`
  - Fixes the last 3 videos in the database
  - Creates unique video files for each video
  - Updates the database with the new URLs
  - Useful for fixing videos that are showing the same content

## How It Works

1. **Detection**: The system identifies problematic videos by:
   - Checking if the file exists
   - Verifying the file size is appropriate (>1MB)
   - Examining file headers and format

2. **Fixing Methods**:
   - **FFmpeg Remuxing**: Attempts to fix headers and container format
   - **Unique Video Creation**: Creates unique video files for each video to prevent duplicates
   - **Database Updates**: Marks videos as fixed in metadata and tracks original URLs

3. **Integration**: The system works with the frontend to:
   - Provide fallback URLs for videos
   - Retry loading videos that initially fail
   - Display appropriate error messages

## Preventing Duplicate Videos

The system now creates unique video files for each video that needs fixing, rather than reusing the same working video for multiple videos. This ensures that:

1. Each video has a unique file, even if the content is temporarily the same
2. The database tracks both the original and new URLs in the metadata
3. When videos are regenerated in the future, they can be properly replaced without affecting other videos

## Usage

### For Developers

- The health check system runs automatically in the background
- Monitor logs for any issues with video fixing
- Use the manual scripts for immediate fixes

### For Administrators

- Run `npm run check-videos` after server deployment
- Use `npm run fix-video <id>` when users report specific video issues
- Use `npm run fix-video-urls` when multiple videos are showing the same content
- Check server logs for "video health check" entries to monitor activity

## Troubleshooting

If videos are still not playing correctly:

1. Check the server logs for any errors in the health check system
2. Verify that FFmpeg is installed and accessible
3. Ensure the database connection is working properly
4. Check that the video directory has proper permissions
5. Verify that at least one working video exists in the system 