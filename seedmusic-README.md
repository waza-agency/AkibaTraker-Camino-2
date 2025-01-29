# Music Database Management

This document outlines the commands available for managing the music database.

## Available Commands

You can run commands using either `tsx` directly or through `npm run`:

### View Database Contents
Shows all songs currently in the database.
```bash
# Using tsx
tsx seed-music.ts

# Using npm
npm run seed:music
```

### Add Songs to Database
Seeds the database with predefined songs. Will run cleanup first to prevent duplicates.
```bash
# Using tsx
tsx seed-music.ts --seed

# Using npm
npm run seed:music -- --seed
```

### Remove All Songs
Completely clears the music database.
```bash
# Using tsx
tsx seed-music.ts --remove-all

# Using npm
npm run seed:music -- --remove-all
```

### Remove Specific Song
Removes a single song by its title.
```bash
# Using tsx
tsx seed-music.ts --remove=Cupid

# Using npm
npm run seed:music -- --remove=Cupid
```

### Clean Up Duplicates
Removes any duplicate songs (matching title and artist).
```bash
# Using tsx
tsx seed-music.ts --cleanup

# Using npm
npm run seed:music -- --cleanup
```

## Examples

### Example 1: Reset and Seed Database
To completely reset your database and add fresh songs:
```bash
# First, remove all existing songs
npm run seed:music -- --remove-all

# Then, seed with new songs
npm run seed:music -- --seed
```

### Example 2: Maintenance
To clean up the database without adding new songs:
```bash
npm run seed:music -- --cleanup
```

### Example 3: Update Songs
To update your song collection:
```bash
# Remove specific songs you want to update
npm run seed:music -- --remove=OldSong

# Check the database state
npm run seed:music

# Add new songs
npm run seed:music -- --seed
```

## Notes

- Always verify the database state after operations by running the command without flags
- The --seed command includes automatic duplicate cleanup
- Song titles in --remove commands are case-sensitive
- Commands can't be combined - run them sequentially if needed
- When using npm run, remember to add -- before any flags
- The database URL must be properly configured in your environment

## Troubleshooting

If you encounter issues:

1. Verify your database connection
2. Check the console for error messages
3. Ensure song titles match exactly for removal
4. Try removing all songs and reseeding if database gets into an inconsistent state
5. Make sure you're using the correct command format (note the -- when using npm run)