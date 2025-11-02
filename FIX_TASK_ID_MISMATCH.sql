-- =====================================================
-- FIX TASK ID TYPE MISMATCH
-- =====================================================
-- This fixes the mismatch between tasks.id (UUID) and 
-- materials/task_notes task_id (TEXT)

-- 1. Update materials table - change task_id from TEXT to UUID
ALTER TABLE IF EXISTS public.materials 
ALTER COLUMN task_id TYPE UUID USING task_id::UUID;

-- 2. Update task_notes table - change task_id from TEXT to UUID  
ALTER TABLE IF EXISTS public.task_notes 
ALTER COLUMN task_id TYPE UUID USING task_id::UUID;

-- 3. Update task_files table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_files') THEN
    ALTER TABLE public.task_files 
    ALTER COLUMN task_id TYPE UUID USING task_id::UUID;
  END IF;
END $$;

-- 4. Recreate the cascading delete function with correct types
CREATE OR REPLACE FUNCTION delete_task_materials()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete materials linked to this task (now both are UUID)
  DELETE FROM public.materials WHERE task_id = OLD.id;
  
  -- Delete notes linked to this task (now both are UUID)
  DELETE FROM public.task_notes WHERE task_id = OLD.id;
  
  -- Delete task_files if exists (now both are UUID)
  BEGIN
    DELETE FROM public.task_files WHERE task_id = OLD.id;
  EXCEPTION
    WHEN undefined_table THEN
      NULL; -- Table doesn't exist, skip
  END;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 5. Recreate the trigger
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
  tasks_id_type TEXT;
  materials_task_id_type TEXT;
  notes_task_id_type TEXT;
BEGIN
  -- Get column types
  SELECT data_type INTO tasks_id_type
  FROM information_schema.columns 
  WHERE table_name = 'tasks' AND column_name = 'id';
  
  SELECT data_type INTO materials_task_id_type
  FROM information_schema.columns 
  WHERE table_name = 'materials' AND column_name = 'task_id';
  
  SELECT data_type INTO notes_task_id_type
  FROM information_schema.columns 
  WHERE table_name = 'task_notes' AND column_name = 'task_id';
  
  RAISE NOTICE '✅ Type Mismatch Fix Complete!';
  RAISE NOTICE '📊 tasks.id type: %', tasks_id_type;
  RAISE NOTICE '📊 materials.task_id type: %', materials_task_id_type;
  RAISE NOTICE '📊 task_notes.task_id type: %', notes_task_id_type;
  
  IF tasks_id_type = materials_task_id_type AND tasks_id_type = notes_task_id_type THEN
    RAISE NOTICE '🎉 SUCCESS! All types match now!';
  ELSE
    RAISE NOTICE '⚠️  Types still don''t match - check manually';
  END IF;
END $$;
