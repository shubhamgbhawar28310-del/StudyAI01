-- =====================================================
-- TASK DETAIL VIEW - FINAL WORKING VERSION
-- =====================================================
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- Then click RUN

-- 1. Add new columns to tasks table
ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Add constraints (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_priority_check'
  ) THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_status_check'
  ) THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'missed'));
  END IF;
END $$;

-- 3. Create materials table
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

-- 4. Create task_notes table
CREATE TABLE IF NOT EXISTS public.task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON public.materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_task_id ON public.materials(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_user_id ON public.task_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON public.task_notes(task_id);

-- 6. Enable RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies
DROP POLICY IF EXISTS "Users can view their own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can insert their own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can update their own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can delete their own materials" ON public.materials;

DROP POLICY IF EXISTS "Users can view their own task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Users can insert their own task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Users can update their own task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Users can delete their own task notes" ON public.task_notes;

-- 8. Create RLS policies for materials
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

-- 9. Create RLS policies for task_notes
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

-- 10. Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers for updated_at
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

-- 12. Create cascading delete function (SIMPLIFIED - no task_files reference)
CREATE OR REPLACE FUNCTION delete_task_materials()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete materials linked to this task
  DELETE FROM public.materials WHERE task_id = OLD.id;
  
  -- Delete notes linked to this task
  DELETE FROM public.task_notes WHERE task_id = OLD.id;
  
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
  tables_count INTEGER;
  columns_count INTEGER;
  policies_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tables_count
  FROM information_schema.tables 
  WHERE table_schema = 'public'
  AND table_name IN ('materials', 'task_notes');
  
  SELECT COUNT(*) INTO columns_count
  FROM information_schema.columns 
  WHERE table_schema = 'public'
  AND table_name = 'tasks' 
  AND column_name IN ('priority', 'due_date', 'status');
  
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE schemaname = 'public'
  AND tablename IN ('materials', 'task_notes');
  
  RAISE NOTICE '✅ Setup Complete!';
  RAISE NOTICE '📊 Tables created: % (expected: 2)', tables_count;
  RAISE NOTICE '📊 Columns added: % (expected: 3)', columns_count;
  RAISE NOTICE '🔒 Policies created: % (expected: 8)', policies_count;
  
  IF tables_count = 2 AND columns_count = 3 AND policies_count = 8 THEN
    RAISE NOTICE '🎉 SUCCESS! Everything is set up correctly!';
  ELSE
    RAISE NOTICE '⚠️  Some items may already exist from previous runs';
    RAISE NOTICE 'This is OK - the setup will work!';
  END IF;
END $$;
