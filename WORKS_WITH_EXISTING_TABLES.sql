-- =====================================================
-- TASK DETAIL VIEW - WORKS WITH YOUR EXISTING TABLES
-- =====================================================
-- This works with the tables you already created in create_user_data_tables.sql

-- 1. Add status column to tasks (if not exists)
-- Your tasks table already has priority and due_date from create_user_data_tables.sql
ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Add status constraint (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_status_check'
  ) THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'missed'));
  END IF;
END $$;

-- 3. Create task_notes table (materials already exists)
CREATE TABLE IF NOT EXISTS public.task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,  -- UUID to match your tasks.id
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create task_files table (for the file upload system)
CREATE TABLE IF NOT EXISTS public.task_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,  -- UUID to match your tasks.id
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT,
  storage_type TEXT DEFAULT 'local',
  file_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_task_notes_user_id ON public.task_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON public.task_notes(task_id);
CREATE INDEX IF NOT EXISTS idx_task_files_user_id ON public.task_files(user_id);
CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON public.task_files(task_id);

-- 6. Enable RLS
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Users can insert their own task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Users can update their own task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Users can delete their own task notes" ON public.task_notes;

DROP POLICY IF EXISTS "Users can view their own task files" ON public.task_files;
DROP POLICY IF EXISTS "Users can insert their own task files" ON public.task_files;
DROP POLICY IF EXISTS "Users can update their own task files" ON public.task_files;
DROP POLICY IF EXISTS "Users can delete their own task files" ON public.task_files;

-- 8. Create RLS policies for task_notes
CREATE POLICY "Users can view their own task notes"
  ON public.task_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task notes"
  ON public.task_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task notes"
  ON public.task_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task notes"
  ON public.task_notes FOR DELETE
  USING (auth.uid() = user_id);

-- 9. Create RLS policies for task_files
CREATE POLICY "Users can view their own task files"
  ON public.task_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task files"
  ON public.task_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task files"
  ON public.task_files FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task files"
  ON public.task_files FOR DELETE
  USING (auth.uid() = user_id);

-- 10. Create/update the update timestamp function (may already exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_task_notes_updated_at ON public.task_notes;
CREATE TRIGGER update_task_notes_updated_at
  BEFORE UPDATE ON public.task_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_files_updated_at ON public.task_files;
CREATE TRIGGER update_task_files_updated_at
  BEFORE UPDATE ON public.task_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 12. Create cascading delete function
-- This works with your existing materials table (which has task_ids array)
CREATE OR REPLACE FUNCTION delete_task_materials()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete notes linked to this task
  DELETE FROM public.task_notes WHERE task_id = OLD.id;
  
  -- Delete files linked to this task
  DELETE FROM public.task_files WHERE task_id = OLD.id;
  
  -- For materials table: remove this task from task_ids array
  -- (Your materials table uses task_ids TEXT[] array, not task_id)
  UPDATE public.materials 
  SET task_ids = array_remove(task_ids, OLD.id::TEXT)
  WHERE OLD.id::TEXT = ANY(task_ids);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 13. Create trigger for cascading delete
DROP TRIGGER IF EXISTS delete_task_materials_trigger ON public.tasks;
CREATE TRIGGER delete_task_materials_trigger
  BEFORE DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION delete_task_materials();

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
DECLARE
  task_notes_exists BOOLEAN;
  task_files_exists BOOLEAN;
  status_column_exists BOOLEAN;
  policies_count INTEGER;
BEGIN
  -- Check if tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'task_notes'
  ) INTO task_notes_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'task_files'
  ) INTO task_files_exists;
  
  -- Check if status column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'status'
  ) INTO status_column_exists;
  
  -- Count policies
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE tablename IN ('task_notes', 'task_files');
  
  RAISE NOTICE '✅ Setup Complete!';
  RAISE NOTICE '📊 task_notes table: %', CASE WHEN task_notes_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '📊 task_files table: %', CASE WHEN task_files_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '📊 status column: %', CASE WHEN status_column_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '🔒 Policies created: % (expected: 8)', policies_count;
  
  IF task_notes_exists AND task_files_exists AND status_column_exists AND policies_count = 8 THEN
    RAISE NOTICE '🎉 SUCCESS! Everything is set up correctly!';
    RAISE NOTICE '✨ Your Task Detail View is ready to use!';
  ELSE
    RAISE NOTICE '⚠️  Setup completed but some items may need attention';
  END IF;
END $$;
