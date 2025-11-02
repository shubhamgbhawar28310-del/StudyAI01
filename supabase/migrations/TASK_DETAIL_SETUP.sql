-- =====================================================
-- TASK DETAIL VIEW - DATABASE SCHEMA
-- =====================================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Update tasks table to add priority and due_date if not exists
ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'missed'));

-- 2. Create materials table (if not exists)
-- Note: task_id is TEXT to match the tasks table id column type
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT, -- Can be null for standalone materials, references tasks(id)
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('note', 'pdf', 'image', 'document', 'presentation', 'link', 'other')),
  content TEXT, -- For notes or text content
  file_name TEXT,
  file_url TEXT, -- Supabase Storage URL
  file_path TEXT, -- Path in Supabase Storage
  file_size BIGINT,
  subject TEXT,
  tags TEXT[], -- Array of tags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create notes table for task-specific notes
-- Note: task_id is TEXT to match the tasks table id column type
CREATE TABLE IF NOT EXISTS public.task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL, -- References tasks(id)
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON public.materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_task_id ON public.materials(task_id);
CREATE INDEX IF NOT EXISTS idx_materials_user_task ON public.materials(user_id, task_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON public.materials(type);

CREATE INDEX IF NOT EXISTS idx_task_notes_user_id ON public.task_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON public.task_notes(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_user_task ON public.task_notes(user_id, task_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority) WHERE priority IS NOT NULL;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for materials

-- Allow users to view only their own materials
CREATE POLICY "Users can view their own materials"
  ON public.materials
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own materials
CREATE POLICY "Users can insert their own materials"
  ON public.materials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own materials
CREATE POLICY "Users can update their own materials"
  ON public.materials
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own materials
CREATE POLICY "Users can delete their own materials"
  ON public.materials
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create RLS Policies for task_notes

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

-- 8. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_materials_updated_at ON public.materials;
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_notes_updated_at ON public.task_notes;
CREATE TRIGGER update_task_notes_updated_at
  BEFORE UPDATE ON public.task_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Create function to delete materials when task is deleted
-- This ensures cascading deletes work even though we can't use foreign keys
-- (because tasks.id is TEXT and generated client-side)
CREATE OR REPLACE FUNCTION delete_task_materials()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all materials linked to this task
  DELETE FROM public.materials WHERE task_id = OLD.id;
  -- Delete all notes linked to this task
  DELETE FROM public.task_notes WHERE task_id = OLD.id;
  -- Delete all task_files linked to this task (if table exists)
  DELETE FROM public.task_files WHERE task_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for cascading delete
DROP TRIGGER IF EXISTS delete_task_materials_trigger ON public.tasks;
CREATE TRIGGER delete_task_materials_trigger
  BEFORE DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION delete_task_materials();

-- =====================================================
-- SUPABASE STORAGE BUCKET SETUP
-- =====================================================
-- Create storage bucket for task materials
-- Go to Supabase Dashboard > Storage > Create Bucket
-- Bucket name: task-materials
-- Public: No (Private)
--
-- Then add these storage policies:
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

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'materials', 'task_notes');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('materials', 'task_notes');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('materials', 'task_notes');

-- Check if columns were added to tasks
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('priority', 'due_date', 'status');
