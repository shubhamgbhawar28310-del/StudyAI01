-- Music System Setup for Study Planner
-- Simple music storage and playback system

-- Create music storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'music',
  'music',
  true,
  52428800, -- 50MB limit (in bytes)
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  duration INTEGER, -- Duration in seconds
  public_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view songs" ON songs;
DROP POLICY IF EXISTS "Admins can manage songs" ON songs;
DROP POLICY IF EXISTS "Admins can update songs" ON songs;
DROP POLICY IF EXISTS "Admins can delete songs" ON songs;

-- RLS Policies for songs table - Allow public read access
CREATE POLICY "Anyone can view songs" ON songs
  FOR SELECT USING (true);

-- Only admins can insert/update/delete songs (you can modify this based on your admin system)
-- For now, we'll use a simple email check - replace with your admin email
CREATE POLICY "Admins can manage songs" ON songs
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' = 'kishanindrachand@gmail.com' OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Admins can update songs" ON songs
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'kishanindrachand@gmail.com' OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Admins can delete songs" ON songs
  FOR DELETE USING (
    auth.jwt() ->> 'email' = 'kishanindrachand@gmail.com' OR
    auth.role() = 'service_role'
  );

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Admins can upload music files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view music files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update music files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete music files" ON storage.objects;

-- Storage policies for music bucket
CREATE POLICY "Admins can upload music files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'music' AND 
    (auth.jwt() ->> 'email' = 'kishanindrachand@gmail.com' OR auth.role() = 'service_role')
  );

CREATE POLICY "Anyone can view music files" ON storage.objects
  FOR SELECT USING (bucket_id = 'music');

CREATE POLICY "Admins can update music files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'music' AND 
    (auth.jwt() ->> 'email' = 'kishanindrachand@gmail.com' OR auth.role() = 'service_role')
  );

CREATE POLICY "Admins can delete music files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'music' AND 
    (auth.jwt() ->> 'email' = 'kishanindrachand@gmail.com' OR auth.role() = 'service_role')
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_songs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_songs_updated_at ON songs;

-- Create trigger for updated_at
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION update_songs_updated_at();