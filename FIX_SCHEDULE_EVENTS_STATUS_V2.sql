-- =====================================================
-- FIX SCHEDULE_EVENTS STATUS COLUMN (V2)
-- Handles existing data properly
-- =====================================================

-- Step 1: Check what status values currently exist
SELECT 
    'Current Status Values' as info,
    status,
    COUNT(*) as count
FROM schedule_events
GROUP BY status
ORDER BY count DESC;

-- Step 2: Drop existing constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'schedule_events_status_check'
        AND table_name = 'schedule_events'
    ) THEN
        ALTER TABLE schedule_events DROP CONSTRAINT schedule_events_status_check;
        RAISE NOTICE '✓ Dropped existing status constraint';
    END IF;
END $$;

-- Step 3: Add status column if it doesn't exist
ALTER TABLE schedule_events
ADD COLUMN IF NOT EXISTS status TEXT;

-- Step 4: Fix all existing status values
-- Map any invalid values to valid ones
UPDATE schedule_events
SET status = CASE 
    WHEN status IS NULL THEN 'pending'
    WHEN status = 'active' THEN 'pending'
    WHEN status = 'done' THEN 'completed'
    WHEN status = 'canceled' THEN 'cancelled'
    WHEN status IN ('pending', 'completed', 'cancelled') THEN status
    ELSE 'pending'  -- Default for any other value
END
WHERE status IS NULL 
   OR status NOT IN ('pending', 'completed', 'cancelled');

-- Step 5: Verify all rows have valid status
SELECT 
    'After Fix - Status Values' as info,
    status,
    COUNT(*) as count
FROM schedule_events
GROUP BY status
ORDER BY count DESC;

-- Step 6: Now add the correct constraint
ALTER TABLE schedule_events
ADD CONSTRAINT schedule_events_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled'));

-- Step 7: Set default for new rows
ALTER TABLE schedule_events
ALTER COLUMN status SET DEFAULT 'pending';

-- Step 8: Verify the fix
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check if any invalid rows exist
    SELECT COUNT(*) INTO invalid_count
    FROM schedule_events
    WHERE status NOT IN ('pending', 'completed', 'cancelled');
    
    IF invalid_count = 0 THEN
        RAISE NOTICE '✅ Status column fixed successfully!';
        RAISE NOTICE 'Allowed values: pending, completed, cancelled';
        RAISE NOTICE 'Default value: pending';
        RAISE NOTICE 'All existing rows updated';
    ELSE
        RAISE NOTICE '⚠️  Warning: % rows still have invalid status', invalid_count;
    END IF;
END $$;

-- Step 9: Show summary
SELECT 
    '📊 Summary' as info,
    COUNT(*) as total_events,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
FROM schedule_events;
