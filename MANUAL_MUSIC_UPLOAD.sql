-- Manual Music Upload Helper Script
-- Run this in Supabase SQL Editor after uploading files to storage

-- Replace these values with your actual file details
-- You can run this multiple times for different songs

INSERT INTO songs (title, artist, file_name, file_path, file_size, public_url) 
VALUES 
  -- Example entries - replace with your actual files
  (
    'Lofi Study Beat 1',
    'Study Music',
    'lofi-beat-1.mp3',
    'uploads/lofi-beat-1.mp3',
    2500000,  -- ~2.5MB in bytes
    'https://your-project-id.supabase.co/storage/v1/object/public/music/uploads/lofi-beat-1.mp3'
  ),
  (
    'Ambient Focus',
    'Relaxing Sounds',
    'ambient-focus.mp3', 
    'uploads/ambient-focus.mp3',
    3200000,  -- ~3.2MB in bytes
    'https://your-project-id.supabase.co/storage/v1/object/public/music/uploads/ambient-focus.mp3'
  ),
  (
    'Classical Piano',
    'Classical Music',
    'classical-piano.mp3',
    'uploads/classical-piano.mp3',
    4100000,  -- ~4.1MB in bytes
    'https://your-project-id.supabase.co/storage/v1/object/public/music/uploads/classical-piano.mp3'
  );

-- After running this, your songs should appear in the music player!

-- To check if the songs were added successfully:
SELECT * FROM songs ORDER BY created_at DESC;

-- To delete a song if needed:
-- DELETE FROM songs WHERE title = 'Song Title';

-- To update a song's details:
-- UPDATE songs SET artist = 'New Artist Name' WHERE title = 'Song Title';