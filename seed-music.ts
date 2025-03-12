import 'dotenv/config';
import { db } from "./db";

// Log environment for debugging
console.log('Current environment variables:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'exists' : 'missing',
  NODE_ENV: process.env.NODE_ENV
});

// Parse command line arguments - fix for npm run
const args = process.argv;
console.log('Raw arguments:', args); // Debug log

// Look for our flags after the "seed-music.ts" in the arguments
const scriptIndex = args.findIndex(arg => arg.includes('seed-music.ts'));
const scriptArgs = args.slice(scriptIndex + 1);
console.log('Script arguments:', scriptArgs); // Debug log

const isCleanupOnly = scriptArgs.includes('--cleanup');
const isRemoveAll = scriptArgs.includes('--remove-all');
const isSeed = scriptArgs.includes('--seed');
const removeTitle = scriptArgs.find(arg => arg.startsWith('--remove='))?.split('=')[1];

console.log('Parsed flags:', {
  isCleanupOnly,
  isRemoveAll,
  isSeed,
  removeTitle
});

async function listAllSongs() {
  const result = await db.query('SELECT * FROM music_library');
  console.log('\nCurrent songs in database:');
  if (result.rows.length === 0) {
    console.log('No songs found in database');
  } else {
    result.rows.forEach(song => {
      console.log(`- ${song.title} by ${song.artist} (ID: ${song.id})`);
    });
  }
  console.log('\n');
}

async function removeAllSongs() {
  await db.query('DELETE FROM music_library');
}

async function cleanupDuplicates() {
  try {
    console.log('Cleaning up duplicate songs...');
    
    // Get all songs
    const result = await db.query('SELECT * FROM music_library');
    const songs = result.rows;
    console.log('Current total songs:', songs.length);
    
    // Track unique songs by title and artist
    const seen = new Set();
    const duplicates: number[] = [];
    
    songs.forEach(song => {
      const key = `${song.title}-${song.artist}`;
      if (seen.has(key)) {
        duplicates.push(song.id);
      } else {
        seen.add(key);
      }
    });

    // Delete duplicates
    if (duplicates.length > 0) {
      for (const id of duplicates) {
        await db.query('DELETE FROM music_library WHERE id = $1', [id]);
      }
      console.log(`Removed ${duplicates.length} duplicate songs`);
      console.log('Remaining songs:', songs.length - duplicates.length);
    } else {
      console.log('No duplicates found');
    }
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
  }
}

async function seedDatabase() {
  console.log('Starting database seeding...');
  await cleanupDuplicates();
  
  const songs = [
    {
      title: "Pon Pon Pon",
      artist: "Kyary Pamyu Pamyu",
      mood: "Party",
      storageUrl: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeiexrz2iyivgepluiurdcfbfgtctfcdkwggv4ec3b3suumkrwk6k5i"
    }
  ];

  try {
    console.log('Seeding music library...');
    for (const song of songs) {
      await db.query(
        'INSERT INTO music_library (title, artist, mood, storage_url) VALUES ($1, $2, $3, $4)',
        [song.title, song.artist, song.mood, song.storageUrl]
      );
      console.log(`Added song: ${song.title} by ${song.artist}`);
    }
    console.log('Music library seeded successfully!');
  } catch (error) {
    console.error('Error seeding music library:', error);
    throw error;
  }
}

async function removeSongByTitle(title: string) {
  await db.query('DELETE FROM music_library WHERE title = $1', [title]);
}

async function main() {
  try {
    console.log('Starting main function...');
    console.log('Current database state:');
    await listAllSongs();

    // Handle remove all operation
    if (isRemoveAll) {
      console.log('Executing remove all operation...');
      await removeAllSongs();
      console.log('\nFinal database state:');
      await listAllSongs();
      process.exit(0);
    }

    // Handle cleanup only operation
    if (isCleanupOnly) {
      console.log('Executing cleanup only operation...');
      await cleanupDuplicates();
      console.log('\nFinal database state:');
      await listAllSongs();
      process.exit(0);
    }

    // Handle remove specific title operation
    if (removeTitle) {
      console.log(`Executing remove title operation for: ${removeTitle}`);
      await removeSongByTitle(removeTitle);
      console.log('\nFinal database state:');
      await listAllSongs();
      process.exit(0);
    }

    // Only seed if --seed flag is present
    if (isSeed) {
      console.log('Executing seed operation...');
      await seedDatabase();
      console.log('\nFinal database state:');
      await listAllSongs();
      process.exit(0);
    }

    // If no operation flags are present, just show the current state
    console.log('\nNo operation flags provided. Available commands:');
    console.log('--seed         : Add songs to the database');
    console.log('--cleanup      : Remove duplicate songs');
    console.log('--remove-all   : Remove all songs');
    console.log('--remove=TITLE : Remove a specific song by title');
    process.exit(0);

  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
}); 


