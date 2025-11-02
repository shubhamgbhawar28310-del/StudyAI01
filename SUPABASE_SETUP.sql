-- =====================================================
-- SUPABASE DATABASE SCHEMA FOR TASK FILE UPLOADS
-- =====================================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Create task_files table for storing file metadata and data
CREATE TABLE IF NOT EXISTS public.task_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT,
  storage_type TEXT DEFAULT 'local' CHECK (storage_type IN ('local', 'supabase')),
  file_data TEXT, -- Base64 encoded file data for local storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create task_notes table for storing text notes
CREATE TABLE IF NOT EXISTS public.task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_files_user_id ON public.task_files(user_id);
CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON public.task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_files_user_task ON public.task_files(user_id, task_id);

CREATE INDEX IF NOT EXISTS idx_task_notes_user_id ON public.task_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON public.task_notes(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_user_task ON public.task_notes(user_id, task_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for task_files

-- Allow users to view only their own files
CREATE POLICY "Users can view their own task files"
  ON public.task_files
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own files
CREATE POLICY "Users can insert their own task files"
  ON public.task_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own files
CREATE POLICY "Users can update their own task files"
  ON public.task_files
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own task files"
  ON public.task_files
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Create RLS Policies for task_notes

-- Allow users to view only their own notes
CREATE POLICY "Users can view their own task notes"
  ON public.task_notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own notes
CREATE POLICY "Users can insert their own task notes"
  ON public.task_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own notes
CREATE POLICY "Users can update their own task notes"
  ON public.task_notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own notes
CREATE POLICY "Users can delete their own task notes"
  ON public.task_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for updated_at
CREATE TRIGGER update_task_files_updated_at
  BEFORE UPDATE ON public.task_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_notes_updated_at
  BEFORE UPDATE ON public.task_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- OPTIONAL: Supabase Storage Bucket Setup
-- =====================================================
-- If you want to use Supabase Storage instead of storing base64 in database:
-- 
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket called "task-materials"
-- 3. Set it to Private
-- 4. Add these storage policies:
--
-- INSERT policy:
-- bucket_id = 'task-materials' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- SELECT policy:
-- bucket_id = 'task-materials' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- UPDATE policy:
-- bucket_id = 'task-materials' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- DELETE policy:
-- bucket_id = 'task-materials' AND auth.uid()::text = (storage.foldername(name))[1]

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the setup:

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('task_files', 'task_notes');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('task_files', 'task_notes');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('task_files', 'task_notes');
