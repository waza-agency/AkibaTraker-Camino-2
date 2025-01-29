import fs from 'fs/promises';
import path from 'path';

const CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour
const MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

export async function setupAudioCleanup() {
  const cleanup = async () => {
    try {
      const outputDir = path.join(process.cwd(), 'public', 'trimmed-audio');
      const files = await fs.readdir(outputDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(outputDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.ctimeMs > MAX_AGE) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old audio file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error during audio cleanup:', error);
    }
  };

  // Run cleanup periodically
  setInterval(cleanup, CLEANUP_INTERVAL);
} 