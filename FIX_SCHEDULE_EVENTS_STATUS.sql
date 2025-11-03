-- =====================================================
-- FIX SCHEDULE_EVENTS STATUS COLUMN
-- =====================================================

-- First, check if status column exists and what constraint it has
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'schedule_events_status_check'
    ) THEN
        ALTER TABLE schedule_events DROP CONSTRAINT schedule_events_status_check;
        RAISE NOTICE 'Dropped existing status constraint';
    END IF;
END $$;

-- Add status column if it doesn't exist (without constraint first)
ALTER TABLE schedule_events
ADD COLUMN IF NOT EXISTS status TEXT;

-- Update any NULL status values to 'pending'
UPDATE schedule_events
SET status = 'pending'
WHERE status IS NULL;

-- Now add the correct constraint
ALTER TABLE schedule_events
DROP CONSTRAINT IF EXISTS schedule_events_status_check;

ALTER TABLE schedule_events
ADD CONSTRAINT schedule_events_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled'));

-- Set default for new rows
ALTER TABLE schedule_events
ALTER COLUMN status SET DEFAULT 'pending';

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE '✅ Status column fixed!';
    RAISE NOTICE 'Allowed values: pending, completed, cancelled';
    RAISE NOTICE 'Default value: pending';
END $$;
