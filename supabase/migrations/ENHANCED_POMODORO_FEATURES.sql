-- ============================================================================
-- ENHANCED POMODORO TIMER FEATURES MIGRATION
-- ============================================================================
-- This migration adds:
-- 1. Custom timer presets
-- 2. Task selection and tracking
-- 3. Music playlist management via Supabase Storage
-- 4. Session history and analytics
-- ============================================================================

-- Step 1: Create or enhance user_settings table
-- ============================================================================

-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pomodoro_work_duration INTEGER DEFAULT 25,
  pomodoro_short_break INTEGER DEFAULT 5,
  pomodoro_long_break INTEGER DEFAULT 15,
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

-- Add new columns for enhanced Pomodoro features
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS pomodoro_presets JSONB DEFAULT '[
  {"name": "Classic", "work": 25, "shortBreak": 5, "longBreak": 15, "sessionsUntilLongBreak": 4},
  {"name": "Extended Focus", "work": 50, "shortBreak": 10, "longBreak": 30, "sessionsUntilLongBreak": 3},
  {"name": "Quick Sprint", "work": 15, "shortBreak": 3, "longBreak": 10, "sessionsUntilLongBreak": 4},
  {"name": "Deep Work", "work": 90, "shortBreak": 15, "longBreak": 30, "sessionsUntilLongBreak": 2}
]'::jsonb;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS active_preset_name TEXT DEFAULT 'Classic',
ADD COLUMN IF NOT EXISTS music_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS music_volume DECIMAL(3,2) DEFAULT 0.5 CHECK (music_volume >= 0 AND music_volume <= 1),
ADD COLUMN IF NOT EXISTS active_playlist_id UUID;

COMMENT ON COLUMN user_settings.pomodoro_presets IS 'Array of custom Pomodoro timer presets';
COMMENT ON COLUMN user_settings.active_preset_name IS 'Currently selected preset name';
COMMENT ON COLUMN user_settings.music_enabled IS 'Whether background music is enabled';
COMMENT ON COLUMN user_settings.music_volume IS 'Music volume level (0.0 to 1.0)';

-- Step 2: Create music playlists table
-- ============================================================================

CREATE TABLE IF NOT EXISTS music_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_playlists_user_id ON music_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_music_playlists_is_default ON music_playlists(is_default) WHERE is_default = TRUE;

-- Enable RLS
ALTER TABLE music_playlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own playlists and public ones" ON music_playlists;
CREATE POLICY "Users can view their own playlists and public ones"
  ON music_playlists FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

DROP POLICY IF EXISTS "Users can insert their own playlists" ON music_playlists;
CREATE POLICY "Users can insert their own playlists"
  ON music_playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own playlists" ON music_playlists;
CREATE POLICY "Users can update their own playlists"
  ON music_playlists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own playlists" ON music_playlists;
CREATE POLICY "Users can delete their own playlists"
  ON music_playlists FOR DELETE
  USING (auth.uid() = user_id);

-- Step 3: Create music tracks table
-- ============================================================================

CREATE TABLE IF NOT EXISTS music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES music_playlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  duration INTEGER, -- in seconds
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size BIGINT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_tracks_playlist_id ON music_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_music_tracks_order ON music_tracks(playlist_id, order_index);

-- Enable RLS
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view tracks from accessible playlists" ON music_tracks;
CREATE POLICY "Users can view tracks from accessible playlists"
  ON music_tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM music_playlists mp
      WHERE mp.id = music_tracks.playlist_id
        AND (mp.user_id = auth.uid() OR mp.is_public = TRUE)
    )
  );

DROP POLICY IF EXISTS "Users can manage tracks in their playlists" ON music_tracks;
CREATE POLICY "Users can manage tracks in their playlists"
  ON music_tracks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM music_playlists mp
      WHERE mp.id = music_tracks.playlist_id
        AND mp.user_id = auth.uid()
    )
  );

-- Step 4: Create or enhance pomodoro_sessions table
-- ============================================================================

-- Create pomodoro_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT,
  duration INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  type TEXT DEFAULT 'work' CHECK (type IN ('work', 'short-break', 'long-break')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Add new columns for enhanced tracking
ALTER TABLE pomodoro_sessions
ADD COLUMN IF NOT EXISTS task_title TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS interruptions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS music_played BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS playlist_id UUID REFERENCES music_playlists(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_id ON pomodoro_sessions(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_start_time ON pomodoro_sessions(start_time);

COMMENT ON COLUMN pomodoro_sessions.task_title IS 'Title of task worked on (cached for history)';
COMMENT ON COLUMN pomodoro_sessions.notes IS 'Session notes or reflections';
COMMENT ON COLUMN pomodoro_sessions.interruptions IS 'Number of interruptions during session';
COMMENT ON COLUMN pomodoro_sessions.music_played IS 'Whether music was played during session';

-- Step 5: Create function to get user's Pomodoro statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pomodoro_stats(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_sessions', COUNT(*),
    'completed_sessions', COUNT(*) FILTER (WHERE completed = TRUE),
    'total_minutes', SUM(duration) / 60,
    'average_session_length', AVG(duration) / 60,
    'most_productive_hour', (
      SELECT EXTRACT(HOUR FROM start_time)
      FROM pomodoro_sessions
      WHERE completed = TRUE
      GROUP BY EXTRACT(HOUR FROM start_time)
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ),
    'tasks_worked_on', COUNT(DISTINCT task_id) FILTER (WHERE task_id IS NOT NULL),
    'interruptions', SUM(interruptions),
    'sessions_by_day', (
      SELECT json_agg(
        json_build_object(
          'date', date,
          'count', count
        ) ORDER BY date
      )
      FROM (
        SELECT 
          CAST(start_time AS DATE) as date,
          COUNT(*) as count
        FROM pomodoro_sessions
        WHERE completed = TRUE
          AND start_time >= NOW() - CAST(p_days || ' days' AS INTERVAL)
        GROUP BY CAST(start_time AS DATE)
      ) daily_stats
    )
  ) INTO v_result
  FROM pomodoro_sessions
  WHERE start_time >= NOW() - CAST(p_days || ' days' AS INTERVAL);
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function to save custom preset
-- ============================================================================

CREATE OR REPLACE FUNCTION save_pomodoro_preset(
  p_user_id UUID,
  p_preset_name TEXT,
  p_work_duration INTEGER,
  p_short_break INTEGER,
  p_long_break INTEGER,
  p_sessions_until_long_break INTEGER DEFAULT 4
)
RETURNS JSON AS $$
DECLARE
  v_presets JSONB;
  v_new_preset JSONB;
BEGIN
  -- Get current presets
  SELECT pomodoro_presets INTO v_presets
  FROM user_settings
  WHERE user_id = p_user_id;
  
  -- Create new preset object
  v_new_preset := json_build_object(
    'name', p_preset_name,
    'work', p_work_duration,
    'shortBreak', p_short_break,
    'longBreak', p_long_break,
    'sessionsUntilLongBreak', p_sessions_until_long_break
  )::jsonb;
  
  -- Remove existing preset with same name if exists
  v_presets := (
    SELECT jsonb_agg(preset)
    FROM jsonb_array_elements(v_presets) preset
    WHERE preset->>'name' != p_preset_name
  );
  
  -- Add new preset
  v_presets := COALESCE(v_presets, '[]'::jsonb) || jsonb_build_array(v_new_preset);
  
  -- Update user settings
  UPDATE user_settings
  SET 
    pomodoro_presets = v_presets,
    active_preset_name = p_preset_name,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'preset', v_new_preset,
    'all_presets', v_presets
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create default music playlist
-- ============================================================================

-- Insert default study music playlist (will be populated with tracks later)
INSERT INTO music_playlists (user_id, name, description, is_public, is_default)
SELECT 
  NULL, -- System playlist
  'Focus & Study',
  'Curated ambient and instrumental music for deep focus',
  TRUE,
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM music_playlists WHERE is_default = TRUE
);

-- Step 8: Create function to get playlist with tracks
-- ============================================================================

CREATE OR REPLACE FUNCTION get_playlist_with_tracks(p_playlist_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'playlist', row_to_json(mp.*),
    'tracks', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', mt.id,
          'title', mt.title,
          'artist', mt.artist,
          'duration', mt.duration,
          'file_path', mt.file_path,
          'order_index', mt.order_index
        ) ORDER BY mt.order_index
      ), '[]'::json)
      FROM music_tracks mt
      WHERE mt.playlist_id = mp.id
    )
  ) INTO v_result
  FROM music_playlists mp
  WHERE mp.id = p_playlist_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create view for Pomodoro analytics
-- ============================================================================

DROP VIEW IF EXISTS pomodoro_analytics_view;

CREATE VIEW pomodoro_analytics_view AS
SELECT 
  ps.id,
  ps.task_id,
  ps.task_title,
  ps.duration,
  ps.completed,
  ps.type,
  ps.start_time,
  ps.end_time,
  ps.interruptions,
  ps.music_played,
  ps.notes,
  t.title as linked_task_title,
  t.subject as task_subject,
  t.priority as task_priority,
  EXTRACT(HOUR FROM ps.start_time)::INTEGER as hour_of_day,
  EXTRACT(DOW FROM ps.start_time)::INTEGER as day_of_week,
  ps.start_time::DATE as session_date
FROM pomodoro_sessions ps
LEFT JOIN tasks t ON ps.task_id::UUID = t.id;

COMMENT ON VIEW pomodoro_analytics_view IS 'Analytics view for Pomodoro sessions with task details';

-- Step 10: Initialize settings for existing users
-- ============================================================================

-- Add default presets to existing users who don't have them
UPDATE user_settings
SET pomodoro_presets = '[
  {"name": "Classic", "work": 25, "shortBreak": 5, "longBreak": 15, "sessionsUntilLongBreak": 4},
  {"name": "Extended Focus", "work": 50, "shortBreak": 10, "longBreak": 30, "sessionsUntilLongBreak": 3},
  {"name": "Quick Sprint", "work": 15, "shortBreak": 3, "longBreak": 10, "sessionsUntilLongBreak": 4},
  {"name": "Deep Work", "work": 90, "shortBreak": 15, "longBreak": 30, "sessionsUntilLongBreak": 2}
]'::jsonb
WHERE pomodoro_presets IS NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Enhanced Pomodoro Features Migration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '🎵 Features Added:';
  RAISE NOTICE '   ✓ Custom timer presets (save unlimited configurations)';
  RAISE NOTICE '   ✓ Music playlist management';
  RAISE NOTICE '   ✓ Music tracks with Supabase Storage integration';
  RAISE NOTICE '   ✓ Enhanced session tracking (interruptions, notes)';
  RAISE NOTICE '   ✓ Pomodoro statistics and analytics';
  RAISE NOTICE '   ✓ Default study music playlist';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Database Objects Created:';
  RAISE NOTICE '   - music_playlists table';
  RAISE NOTICE '   - music_tracks table';
  RAISE NOTICE '   - Enhanced user_settings with presets';
  RAISE NOTICE '   - Enhanced pomodoro_sessions tracking';
  RAISE NOTICE '   - get_pomodoro_stats() function';
  RAISE NOTICE '   - save_pomodoro_preset() function';
  RAISE NOTICE '   - get_playlist_with_tracks() function';
  RAISE NOTICE '   - pomodoro_analytics_view';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '   1. Upload music files to Supabase Storage bucket "music"';
  RAISE NOTICE '   2. Insert track records into music_tracks table';
  RAISE NOTICE '   3. Update frontend with enhanced Pomodoro UI';
  RAISE NOTICE '   4. Implement floating music player';
  RAISE NOTICE '';
END $$;
