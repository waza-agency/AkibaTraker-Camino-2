import 'dotenv/config';
import { checkAndFixAllVideos } from '../server/video-health-check';

async function main() {
  console.log('Starting video health check script...');
  
  try {
    await checkAndFixAllVideos();
    console.log('Video health check completed successfully');
  } catch (error) {
    console.error('Error running video health check:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
}); 