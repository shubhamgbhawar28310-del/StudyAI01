-- ============================================================================
-- COMPREHENSIVE INTEGRATION MIGRATION
-- ============================================================================
-- This migration implements:
-- 1. Material Manager integration with Task Manager
-- 2. Automatic file linking between tasks and materials
-- 3. Dynamic task data fetching for Study Planner
-- 4. Bidirectional sync between tasks and events
-- 5. Pomodoro timer settings and session tracking
-- ============================================================================

-- Step 1: Create materials table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  type TEXT NOT NULL CHECK (type IN ('note', 'pdf', 'image', 'document', 'presentation', 'link', 'other')),
  content TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_path TEXT, -- Path in Supabase Storage
  tags TEXT[],
  linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- NEW: Direct link to task
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for materials
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_linked_task_id ON materials(linked_task_id) WHERE linked_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(user_id, type);
CREATE INDEX IF NOT EXISTS idx_materials_subject ON materials(user_id, subject) WHERE subject IS NOT NULL;

-- Enable RLS on materials
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for materials
DROP POLICY IF EXISTS "Users can view their own materials" ON materials;
CREATE POLICY "Users can view their own materials"
  ON materials FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own materials" ON materials;
CREATE POLICY "Users can insert their own materials"
  ON materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own materials" ON materials;
CREATE POLICY "Users can update their own materials"
  ON materials FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own materials" ON materials;
CREATE POLICY "Users can delete their own materials"
  ON materials FOR DELETE
  USING (auth.uid() = user_id);

-- Step 2: Link task_files to materials automatically
-- ============================================================================

-- Add material_id to task_files for bidirectional linking
ALTER TABLE task_files
ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES materials(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_task_files_material_id ON task_files(material_id) WHERE material_id IS NOT NULL;

-- Function to auto-create material when file is uploaded to task
CREATE OR REPLACE FUNCTION auto_create_material_from_task_file()
RETURNS TRIGGER AS $$
DECLARE
  v_material_id UUID;
  v_task_title TEXT;
  v_task_subject TEXT;
BEGIN
  -- Get task details
  SELECT title, subject INTO v_task_title, v_task_subject
  FROM tasks
  WHERE id = NEW.task_id;
  
  -- Create material entry
  INSERT INTO materials (
    user_id,
    title,
    description,
    subject,
    type,
    file_name,
    file_size,
    file_path,
    linked_task_id
  ) VALUES (
    NEW.user_id,
    NEW.file_name,
    'Uploaded for task: ' || COALESCE(v_task_title, 'Unknown'),
    v_task_subject,
    CASE 
      WHEN NEW.file_name ILIKE '%.pdf' THEN 'pdf'
      WHEN NEW.file_name ILIKE '%.png' OR NEW.file_name ILIKE '%.jpg' OR NEW.file_name ILIKE '%.jpeg' THEN 'image'
      WHEN NEW.file_name ILIKE '%.ppt%' THEN 'presentation'
      WHEN NEW.file_name ILIKE '%.doc%' THEN 'document'
      ELSE 'other'
    END,
    NEW.file_size,
    NEW.file_path,
    NEW.task_id
  ) RETURNING id INTO v_material_id;
  
  -- Link back to task_file
  NEW.material_id := v_material_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create materials
DROP TRIGGER IF EXISTS trigger_auto_create_material ON task_files;
CREATE TRIGGER trigger_auto_create_material
  BEFORE INSERT ON task_files
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_material_from_task_file();

-- Step 3: Add Pomodoro settings to user_settings
-- ============================================================================

-- Create user_settings table if not exists
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pomodoro_work_duration INTEGER DEFAULT 25, -- minutes
  pomodoro_short_break INTEGER DEFAULT 5, -- minutes
  pomodoro_long_break INTEGER DEFAULT 15, -- minutes
  pomodoro_sessions_until_long_break INTEGER DEFAULT 4,
  auto_start_breaks BOOLEAN DEFAULT TRUE,
  auto_start_pomodoros BOOLEAN DEFAULT FALSE,
  notification_sound BOOLEAN DEFAULT TRUE,
  daily_goal_hours INTEGER DEFAULT 4,
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 4: Enhanced schedule_events with progress tracking
-- ============================================================================

-- Add progress tracking columns
ALTER TABLE schedule_events
ADD COLUMN IF NOT EXISTS actual_duration INTEGER, -- actual minutes spent
ADD COLUMN IF NOT EXISTS pomodoro_count INTEGER DEFAULT 0, -- number of pomodoros completed
ADD COLUMN IF NOT EXISTS break_count INTEGER DEFAULT 0; -- number of breaks taken

-- Step 5: Function to dynamically fetch task data for events
-- ============================================================================

CREATE OR REPLACE FUNCTION get_event_with_task_data(p_event_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'event', row_to_json(se.*),
    'task', CASE 
      WHEN se.task_id IS NOT NULL THEN (
        SELECT json_build_object(
          'id', t.id,
          'title', t.title,
          'description', t.description,
          'priority', t.priority,
          'subject', t.subject,
          'due_date', t.due_date,
          'status', t.status,
          'progress', t.progress,
          'estimate', t.estimate,
          'notes', t.notes,
          'files', (
            SELECT COALESCE(json_agg(json_build_object(
              'id', tf.id,
              'file_name', tf.file_name,
              'file_size', tf.file_size,
              'file_path', tf.file_path,
              'created_at', tf.created_at
            )), '[]'::json)
            FROM task_files tf
            WHERE tf.task_id = t.id
          ),
          'notes_list', (
            SELECT COALESCE(json_agg(json_build_object(
              'id', tn.id,
              'title', tn.title,
              'content', tn.content,
              'created_at', tn.created_at
            )), '[]'::json)
            FROM task_notes tn
            WHERE tn.task_id = t.id
          ),
          'materials', (
            SELECT COALESCE(json_agg(json_build_object(
              'id', m.id,
              'title', m.title,
              'type', m.type,
              'file_name', m.file_name,
              'file_size', m.file_size,
              'created_at', m.created_at
            )), '[]'::json)
            FROM materials m
            WHERE m.linked_task_id = t.id
          )
        )
        FROM tasks t
        WHERE t.id = se.task_id
      )
      ELSE NULL
    END
  ) INTO v_result
  FROM schedule_events se
  WHERE se.id = p_event_id
    AND se.user_id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Function to complete study session and sync progress
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_study_session(
  p_event_id UUID,
  p_user_id UUID,
  p_actual_duration INTEGER, -- minutes
  p_pomodoro_count INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_event schedule_events;
  v_task tasks;
  v_progress_increase INTEGER;
  v_result JSON;
BEGIN
  -- Get event
  SELECT * INTO v_event
  FROM schedule_events
  WHERE id = p_event_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  -- Update event as completed
  UPDATE schedule_events
  SET 
    status = 'completed',
    completed_at = NOW(),
    actual_duration = p_actual_duration,
    pomodoro_count = p_pomodoro_count,
    updated_at = NOW()
  WHERE id = p_event_id;
  
  -- If linked to task, update task
  IF v_event.task_id IS NOT NULL THEN
    SELECT * INTO v_task
    FROM tasks
    WHERE id = v_event.task_id;
    
    -- Calculate progress increase (each pomodoro = 10% progress, max 100%)
    v_progress_increase := LEAST(p_pomodoro_count * 10, 100 - COALESCE(v_task.progress, 0));
    
    -- Update task
    UPDATE tasks
    SET 
      status = CASE 
        WHEN (COALESCE(progress, 0) + v_progress_increase) >= 100 THEN 'completed'
        ELSE 'in_progress'
      END,
      progress = LEAST(COALESCE(progress, 0) + v_progress_increase, 100),
      completed = CASE 
        WHEN (COALESCE(progress, 0) + v_progress_increase) >= 100 THEN TRUE
        ELSE completed
      END,
      updated_at = NOW()
    WHERE id = v_event.task_id;
  END IF;
  
  -- Return result
  SELECT json_build_object(
    'success', true,
    'event_id', p_event_id,
    'task_id', v_event.task_id,
    'progress_increase', v_progress_increase,
    'pomodoro_count', p_pomodoro_count
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create view for unified task-material-event data
-- ============================================================================

DROP VIEW IF EXISTS task_materials_events_view;

CREATE VIEW task_materials_events_view AS
SELECT 
  t.id as task_id,
  t.user_id,
  t.title as task_title,
  t.description as task_description,
  t.priority,
  t.subject,
  t.due_date,
  t.status as task_status,
  t.progress,
  t.completed,
  -- Materials count
  (SELECT COUNT(*) FROM materials m WHERE m.linked_task_id = t.id) as materials_count,
  -- Files count
  (SELECT COUNT(*) FROM task_files tf WHERE tf.task_id = t.id) as files_count,
  -- Notes count
  (SELECT COUNT(*) FROM task_notes tn WHERE tn.task_id = t.id) as notes_count,
  -- Scheduled events
  (
    SELECT json_agg(json_build_object(
      'id', se.id,
      'title', se.title,
      'start_time', se.start_time,
      'end_time', se.end_time,
      'status', se.status,
      'pomodoro_count', se.pomodoro_count
    ))
    FROM schedule_events se
    WHERE se.task_id = t.id
  ) as scheduled_events,
  -- Materials list
  (
    SELECT json_agg(json_build_object(
      'id', m.id,
      'title', m.title,
      'type', m.type,
      'file_name', m.file_name
    ))
    FROM materials m
    WHERE m.linked_task_id = t.id
  ) as materials_list
FROM tasks t
WHERE t.user_id = auth.uid();

COMMENT ON VIEW task_materials_events_view IS 'Unified view of tasks with their materials and scheduled events';

-- Step 8: Initialize default settings for existing users
-- ============================================================================

INSERT INTO user_settings (user_id)
SELECT DISTINCT user_id
FROM tasks
WHERE user_id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Comprehensive Integration Migration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Features Added:';
  RAISE NOTICE '   ✓ Material Manager with automatic task linking';
  RAISE NOTICE '   ✓ Files uploaded to tasks auto-create materials';
  RAISE NOTICE '   ✓ Dynamic task data fetching for Study Planner';
  RAISE NOTICE '   ✓ Pomodoro timer settings per user';
  RAISE NOTICE '   ✓ Progress tracking with pomodoro sessions';
  RAISE NOTICE '   ✓ Bidirectional sync between tasks and events';
  RAISE NOTICE '   ✓ Unified view for task-material-event data';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '   1. Update frontend to use get_event_with_task_data()';
  RAISE NOTICE '   2. Implement Pomodoro timer with user settings';
  RAISE NOTICE '   3. Use complete_study_session() for session completion';
  RAISE NOTICE '   4. Display materials in Material Manager and Task views';
  RAISE NOTICE '';
END $$;
