-- ============================================================================
-- TASK & PLANNER INTEGRATION MIGRATION
-- ============================================================================
-- This migration integrates the Task Manager and Study Planner modules
-- by adding proper foreign keys, status tracking, and unified views.
-- ============================================================================

-- Step 1: Add missing columns to schedule_events table
-- ============================================================================

ALTER TABLE schedule_events
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled'
  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'missed'));

ALTER TABLE schedule_events
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE schedule_events
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE schedule_events
ADD COLUMN IF NOT EXISTS missed_count INTEGER DEFAULT 0;

COMMENT ON COLUMN schedule_events.status IS 'Current status of the scheduled event';
COMMENT ON COLUMN schedule_events.started_at IS 'When the user actually started this event';
COMMENT ON COLUMN schedule_events.completed_at IS 'When the event was marked as completed';
COMMENT ON COLUMN schedule_events.missed_count IS 'Number of times this event was marked as missed';

-- Step 2: Add status column to tasks table if missing
-- ============================================================================

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
  CHECK (status IN ('pending', 'in_progress', 'completed', 'missed'));

COMMENT ON COLUMN tasks.status IS 'Current workflow status of the task';

-- Step 3: Add proper foreign key constraint
-- ============================================================================

-- First, clean up any orphaned task_id references
-- Cast task_id to UUID for comparison
UPDATE schedule_events
SET task_id = NULL
WHERE task_id IS NOT NULL
  AND task_id::uuid NOT IN (SELECT id FROM tasks);

-- Add foreign key constraint with ON DELETE SET NULL
-- This means if a task is deleted, the schedule event remains but task_id becomes NULL
ALTER TABLE schedule_events
DROP CONSTRAINT IF EXISTS fk_schedule_events_task;

ALTER TABLE schedule_events
ADD CONSTRAINT fk_schedule_events_task
  FOREIGN KEY (task_id)
  REFERENCES tasks(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Step 4: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_schedule_events_task_id 
  ON schedule_events(task_id)
  WHERE task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_schedule_events_user_date 
  ON schedule_events(user_id, start_time);

CREATE INDEX IF NOT EXISTS idx_schedule_events_status 
  ON schedule_events(user_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_status 
  ON tasks(user_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date 
  ON tasks(user_id, due_date)
  WHERE due_date IS NOT NULL;

-- Step 5: Create unified view for task-schedule data
-- ============================================================================

CREATE OR REPLACE VIEW task_schedule_view AS
SELECT 
  t.id as task_id,
  t.user_id,
  t.title as task_title,
  t.description as task_description,
  t.priority,
  t.difficulty,
  t.subject,
  t.due_date,
  t.due_time,
  t.completed as task_completed,
  t.status as task_status,
  t.progress,
  t.created_at as task_created_at,
  t.updated_at as task_updated_at,
  se.id as schedule_id,
  se.title as schedule_title,
  se.description as schedule_description,
  se.start_time,
  se.end_time,
  se.type as event_type,
  se.status as schedule_status,
  se.started_at,
  se.completed_at,
  se.missed_count,
  (SELECT COUNT(*) FROM task_files WHERE task_id = t.id) as file_count,
  (SELECT COUNT(*) FROM task_notes WHERE task_id = t.id) as note_count,
  -- Calculate if task is overdue
  CASE 
    WHEN t.due_date IS NOT NULL 
      AND t.due_date < CURRENT_DATE 
      AND t.status != 'completed' 
    THEN true 
    ELSE false 
  END as is_overdue,
  -- Calculate if event is upcoming (within next 24 hours)
  CASE 
    WHEN se.start_time IS NOT NULL 
      AND se.start_time > NOW() 
      AND se.start_time < NOW() + INTERVAL '24 hours'
      AND se.status = 'scheduled'
    THEN true 
    ELSE false 
  END as is_upcoming
FROM tasks t
LEFT JOIN schedule_events se ON t.id = se.task_id
WHERE t.user_id = auth.uid();

COMMENT ON VIEW task_schedule_view IS 'Unified view combining tasks and their scheduled events';

-- Step 6: Create helper function to sync task and event status
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_task_event_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a schedule event is completed, mark the linked task as completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.task_id IS NOT NULL THEN
    UPDATE tasks
    SET 
      status = 'completed',
      completed = true,
      updated_at = NOW()
    WHERE id = NEW.task_id;
  END IF;
  
  -- When a schedule event is started, mark the linked task as in_progress
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' AND NEW.task_id IS NOT NULL THEN
    UPDATE tasks
    SET 
      status = 'in_progress',
      updated_at = NOW()
    WHERE id = NEW.task_id AND status = 'pending';
  END IF;
  
  -- When a schedule event is missed, increment missed count on task
  IF NEW.status = 'missed' AND OLD.status != 'missed' AND NEW.task_id IS NOT NULL THEN
    UPDATE tasks
    SET 
      status = 'missed',
      updated_at = NOW()
    WHERE id = NEW.task_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger for automatic status sync
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_sync_task_event_status ON schedule_events;

CREATE TRIGGER trigger_sync_task_event_status
  AFTER UPDATE OF status ON schedule_events
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION sync_task_event_status();

-- Step 8: Create function to get unscheduled tasks
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unscheduled_tasks(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  priority TEXT,
  subject TEXT,
  due_date DATE,
  due_time TIME,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.priority,
    t.subject,
    t.due_date,
    t.due_time,
    t.status,
    t.created_at
  FROM tasks t
  WHERE t.user_id = p_user_id
    AND t.completed = false
    AND NOT EXISTS (
      SELECT 1 
      FROM schedule_events se 
      WHERE se.task_id = t.id 
        AND se.status != 'missed'
    )
  ORDER BY 
    CASE t.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    t.due_date NULLS LAST,
    t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create function to get available time slots
-- ============================================================================

CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_slot_duration_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
  slot_date DATE,
  slot_start_time TIME,
  slot_end_time TIME,
  is_available BOOLEAN
) AS $$
DECLARE
  v_current_date DATE;
  v_current_hour INTEGER;
  v_slot_start TIME;
  v_slot_end TIME;
  v_has_conflict BOOLEAN;
BEGIN
  -- Loop through each date in range
  v_current_date := p_start_date;
  
  WHILE v_current_date <= p_end_date LOOP
    -- Loop through study hours (8am to 10pm)
    FOR v_current_hour IN 8..21 LOOP
      v_slot_start := (v_current_hour || ':00:00')::TIME;
      v_slot_end := ((v_current_hour + (p_slot_duration_minutes / 60.0)) || ':00:00')::TIME;
      
      -- Check if there's a conflicting event
      SELECT EXISTS (
        SELECT 1
        FROM schedule_events se
        WHERE se.user_id = p_user_id
          AND se.start_time::DATE = v_current_date
          AND (
            (se.start_time::TIME, se.end_time::TIME) OVERLAPS (v_slot_start, v_slot_end)
          )
          AND se.status != 'missed'
      ) INTO v_has_conflict;
      
      -- Return the slot
      slot_date := v_current_date;
      slot_start_time := v_slot_start;
      slot_end_time := v_slot_end;
      is_available := NOT v_has_conflict;
      
      RETURN NEXT;
    END LOOP;
    
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Update RLS policies
-- ============================================================================

-- Ensure schedule_events policies allow proper access
DROP POLICY IF EXISTS "Users can view their own schedule events" ON schedule_events;
CREATE POLICY "Users can view their own schedule events"
  ON schedule_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own schedule events" ON schedule_events;
CREATE POLICY "Users can insert their own schedule events"
  ON schedule_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own schedule events" ON schedule_events;
CREATE POLICY "Users can update their own schedule events"
  ON schedule_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own schedule events" ON schedule_events;
CREATE POLICY "Users can delete their own schedule events"
  ON schedule_events FOR DELETE
  USING (auth.uid() = user_id);

-- Step 11: Create materialized view for dashboard stats (optional optimization)
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS user_productivity_stats AS
SELECT 
  t.user_id,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.completed THEN t.id END) as completed_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'missed' THEN t.id END) as missed_tasks,
  COUNT(DISTINCT se.id) as total_events,
  COUNT(DISTINCT CASE WHEN se.status = 'completed' THEN se.id END) as completed_events,
  COUNT(DISTINCT CASE WHEN se.status = 'missed' THEN se.id END) as missed_events,
  ROUND(
    CASE 
      WHEN COUNT(DISTINCT t.id) > 0 
      THEN (COUNT(DISTINCT CASE WHEN t.completed THEN t.id END)::NUMERIC / COUNT(DISTINCT t.id)::NUMERIC) * 100
      ELSE 0 
    END, 
    2
  ) as task_completion_rate,
  ROUND(
    CASE 
      WHEN COUNT(DISTINCT se.id) > 0 
      THEN (COUNT(DISTINCT CASE WHEN se.status = 'completed' THEN se.id END)::NUMERIC / COUNT(DISTINCT se.id)::NUMERIC) * 100
      ELSE 0 
    END, 
    2
  ) as event_completion_rate
FROM tasks t
LEFT JOIN schedule_events se ON t.id = se.task_id
GROUP BY t.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_productivity_stats_user_id 
  ON user_productivity_stats(user_id);

-- Create function to refresh stats
CREATE OR REPLACE FUNCTION refresh_productivity_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_productivity_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Add helpful comments
-- ============================================================================

COMMENT ON TABLE schedule_events IS 'Scheduled study sessions and events, can be linked to tasks';
COMMENT ON TABLE tasks IS 'User tasks with optional scheduling via schedule_events';
COMMENT ON FUNCTION sync_task_event_status() IS 'Automatically syncs status between tasks and schedule events';
COMMENT ON FUNCTION get_unscheduled_tasks(UUID) IS 'Returns tasks that have not been scheduled yet';
COMMENT ON FUNCTION get_available_time_slots(UUID, DATE, DATE, INTEGER) IS 'Returns available time slots for scheduling';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the migration
DO $$
BEGIN
  RAISE NOTICE '✅ Task & Planner Integration Migration Complete!';
  RAISE NOTICE '📊 Added status tracking to schedule_events';
  RAISE NOTICE '🔗 Added foreign key constraint between tasks and schedule_events';
  RAISE NOTICE '⚡ Created indexes for performance';
  RAISE NOTICE '👁️ Created unified task_schedule_view';
  RAISE NOTICE '🔄 Created automatic status sync trigger';
  RAISE NOTICE '🎯 Created helper functions for scheduling';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your Task Manager and Study Planner are now integrated!';
END $$;
