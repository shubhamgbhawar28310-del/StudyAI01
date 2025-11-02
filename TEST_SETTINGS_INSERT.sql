-- Test Settings Insert
-- Run this to test if the table structure is correct

-- First, check if the table exists and show its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;

-- Test insert with all columns (replace YOUR_USER_ID with your actual user ID)
-- You can get your user ID by running: SELECT auth.uid();

-- Uncomment and modify this to test:
/*
INSERT INTO user_settings (
  user_id,
  display_name,
  email,
  theme,
  language,
  daily_study_goal,
  pomodoro_length,
  break_length,
  auto_start_breaks,
  study_reminders,
  task_deadlines,
  achievements,
  weekly_report
) VALUES (
  auth.uid(), -- This will use your current user ID
  'Test User',
  'test@example.com',
  'dark',
  'English',
  4,
  25,
  5,
  true,
  false,
  false,
  false,
  false
)
ON CONFLICT (user_id) 
DO UPDATE SET
  display_name = EXCLUDED.display_name,
  theme = EXCLUDED.theme,
  updated_at = NOW();

-- View the inserted data
SELECT * FROM user_settings WHERE user_id = auth.uid();
*/

-- Just show your current user ID
SELECT auth.uid() as your_user_id;
