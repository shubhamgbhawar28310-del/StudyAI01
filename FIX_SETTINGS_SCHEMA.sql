-- Fix Settings Schema and Refresh Cache
-- Run this in Supabase SQL Editor if you're getting column errors

-- First, let's verify the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;

-- Drop and recreate the table to ensure clean schema
DROP TABLE IF EXISTS user_settings CASCADE;

-- Recreate with exact column names
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  theme TEXT CHECK (theme IN ('light', 'dark', 'system')) DEFAULT 'system',
  language TEXT DEFAULT 'English',
  daily_study_goal INTEGER DEFAULT 4,
  pomodoro_length INTEGER DEFAULT 25,
  break_length INTEGER DEFAULT 5,
  auto_start_breaks BOOLEAN DEFAULT true,
  study_reminders BOOLEAN DEFAULT false,
  task_deadlines BOOLEAN DEFAULT false,
  achievements BOOLEAN DEFAULT false,
  weekly_report BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_settings TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the table was created correctly
SELECT 'Table created successfully! Columns:' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;
