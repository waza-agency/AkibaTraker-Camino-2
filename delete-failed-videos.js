import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Initialize environment variables
dotenv.config();

// Database connection
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

// Main function to delete failed videos
async function deleteFailedVideos() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Get all failed videos
    const { rows } = await client.query(`
      SELECT id, output_url, metadata, music_file
      FROM videos 
      WHERE status = 'failed'
      ORDER BY id ASC
    `);

    console.log(`Encontrados ${rows.length} videos con errores para eliminar`);
    
    // Process each video
    for (const video of rows) {
      try {
        console.log(`Procesando video ${video.id}`);
        
        // Delete video file if it exists
        if (video.output_url) {
          const videoPath = video.output_url.startsWith('/') 
            ? path.join(process.cwd(), 'public', video.output_url.replace(/^\//, ''))
            : null;
            
          if (videoPath && fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
            console.log(`Archivo de video eliminado: ${videoPath}`);
          }
        }
        
        // Delete audio file if it exists
        if (video.music_file) {
          const audioPath = video.music_file.startsWith('/') 
            ? path.join(process.cwd(), 'public', video.music_file.replace(/^\//, ''))
            : null;
            
          if (audioPath && fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
            console.log(`Archivo de audio eliminado: ${audioPath}`);
          }
        }
        
        // Delete temp files if they exist
        if (video.metadata?.tempVideoPath && fs.existsSync(video.metadata.tempVideoPath)) {
          fs.unlinkSync(video.metadata.tempVideoPath);
          console.log(`Archivo temporal eliminado: ${video.metadata.tempVideoPath}`);
        }
        
        // Delete the video from the database
        await client.query('DELETE FROM videos WHERE id = $1', [video.id]);
        console.log(`Video ${video.id} eliminado de la base de datos`);
      } catch (error) {
        console.error(`Error al procesar el video ${video.id}:`, error);
      }
    }

    console.log('Proceso de eliminación de videos con errores completado');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Conexión a la base de datos cerrada');
  }
}

// Run the main function
deleteFailedVideos(); 