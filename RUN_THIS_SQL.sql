-- =====================================================
-- TASK DETAIL VIEW - WORKING SQL SCRIPT
-- =====================================================
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- Then click RUN

-- 1. Update tasks table to add new columns
ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add constraints if columns were just created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'tasks' AND constraint_name = 'tasks_priority_check'
  ) THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'tasks' AND constraint_name = 'tasks_status_check'
  ) THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'missed'));
  END IF;
END $$;

-- 2. Create materials table
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('note', 'pdf', 'image', 'document', 'presentation', 'link', 'other')),
  content TEXT,
  file_name TEXT,
  file_url TEXT,
  file_path TEXT,
  file_size BIGINT,
  subject TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create task_notes table
CREATE TABLE IF NOT EXISTS public.task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON public.materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_task_id ON public.materials(task_id);
CREATE INDEX IF NOT EXISTS idx_materials_user_task ON public.materials(user_id, task_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON public.materials(type);

CREATE INDEX IF NOT EXISTS idx_task_notes_user_id ON public.task_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON public.task_notes(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_user_task ON public.task_notes(user_id, task_id);

-- 5. Enable RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can insert their own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can update their own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can delete their own materials" ON public.materials;

DROP POLICY IF EXISTS "Users can view their own task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Users can insert their own task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Users can update their own task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Users can delete their own task notes" ON public.task_notes;

-- 7. Create RLS policies for materials
CREATE POLICY "Users can view their own materials"
  ON public.materials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own materials"
  ON public.materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials"
  ON public.materials FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
  ON public.materials FOR DELETE
  USING (auth.uid() = user_id);

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

-- 9. Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for updated_at
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

-- 11. Create cascading delete function
CREATE OR REPLACE FUNCTION delete_task_materials()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete materials linked to this task
  DELETE FROM public.materials WHERE task_id = OLD.id;
  
  -- Delete notes linked to this task
  DELETE FROM public.task_notes WHERE task_id = OLD.id;
  
  -- Delete task_files if the table exists (using dynamic SQL to avoid errors)
  BEGIN
    EXECUTE 'DELETE FROM public.task_files WHERE task_id = $1' USING OLD.id;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist, skip
      NULL;
  END;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for cascading delete
DROP TRIGGER IF EXISTS delete_task_materials_trigger ON public.tasks;
CREATE TRIGGER delete_task_materials_trigger
  BEFORE DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION delete_task_materials();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- This will show you what was created
DO $$
DECLARE
  tables_count INTEGER;
  columns_count INTEGER;
  policies_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tables_count
  FROM information_schema.tables 
  WHERE table_name IN ('materials', 'task_notes');
  
  SELECT COUNT(*) INTO columns_count
  FROM information_schema.columns 
  WHERE table_name = 'tasks' 
  AND column_name IN ('priority', 'due_date', 'status');
  
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE tablename IN ('materials', 'task_notes');
  
  RAISE NOTICE '✅ Setup Complete!';
  RAISE NOTICE '📊 Tables created: %', tables_count;
  RAISE NOTICE '📊 Columns added to tasks: %', columns_count;
  RAISE NOTICE '🔒 RLS policies created: %', policies_count;
  
  IF tables_count = 2 AND columns_count = 3 AND policies_count = 8 THEN
    RAISE NOTICE '🎉 SUCCESS! Everything is set up correctly!';
  ELSE
    RAISE NOTICE '⚠️  Some items may already exist or need attention';
  END IF;
END $$;
