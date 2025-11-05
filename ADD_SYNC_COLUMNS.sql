-- Add sync columns to schedule_events and tasks tables if they don't exist

-- Add columns to schedule_events
ALTER TABLE schedule_events 
ADD COLUMN IF NOT EXISTS synced_to_google BOOLEAN DEFAULT false;

ALTER TABLE schedule_events 
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

ALTER TABLE schedule_events 
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add columns to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS synced_to_google BOOLEAN DEFAULT false;

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedule_events_synced 
ON schedule_events(synced_to_google, google_event_id);

CREATE INDEX IF NOT EXISTS idx_tasks_synced 
ON tasks(synced_to_google, google_event_id);

-- Verify columns were added
SELECT 'schedule_events columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'schedule_events'
  AND column_name IN ('synced_to_google', 'google_event_id', 'last_synced_at');

SELECT 'tasks columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'tasks'
  AND column_name IN ('synced_to_google', 'google_event_id', 'last_synced_at');
