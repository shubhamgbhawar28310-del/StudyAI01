-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  subject TEXT,
  due_date TIMESTAMPTZ,
  due_time TEXT,
  estimate TEXT,
  reminder TEXT,
  progress INTEGER DEFAULT 0,
  pomodoro_sessions INTEGER DEFAULT 0,
  flashcards_generated BOOLEAN DEFAULT false,
  material_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create materials table
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  type TEXT CHECK (type IN ('note', 'pdf', 'image', 'document', 'presentation', 'link', 'other')) DEFAULT 'note',
  content TEXT,
  file_name TEXT,
  file_size INTEGER,
  tags TEXT[],
  task_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  subject TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  last_reviewed TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create flashcard_decks table
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  cards JSONB DEFAULT '[]'::jsonb,
  last_studied TIMESTAMPTZ,
  study_progress JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create pomodoro_sessions table
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id TEXT,
  duration INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  type TEXT CHECK (type IN ('work', 'short-break', 'long-break')) DEFAULT 'work',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create schedule_events table
CREATE TABLE IF NOT EXISTS public.schedule_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type TEXT CHECK (type IN ('task', 'study', 'break', 'other')) DEFAULT 'other',
  task_id TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_to_next_level INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for materials
CREATE POLICY "Users can view own materials" ON public.materials
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own materials" ON public.materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own materials" ON public.materials
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own materials" ON public.materials
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for flashcards
CREATE POLICY "Users can view own flashcards" ON public.flashcards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcards" ON public.flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcards" ON public.flashcards
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcards" ON public.flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for flashcard_decks
CREATE POLICY "Users can view own flashcard_decks" ON public.flashcard_decks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcard_decks" ON public.flashcard_decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcard_decks" ON public.flashcard_decks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcard_decks" ON public.flashcard_decks
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for pomodoro_sessions
CREATE POLICY "Users can view own pomodoro_sessions" ON public.pomodoro_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pomodoro_sessions" ON public.pomodoro_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pomodoro_sessions" ON public.pomodoro_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pomodoro_sessions" ON public.pomodoro_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for schedule_events
CREATE POLICY "Users can view own schedule_events" ON public.schedule_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedule_events" ON public.schedule_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule_events" ON public.schedule_events
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule_events" ON public.schedule_events
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_stats
CREATE POLICY "Users can view own user_stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_stats" ON public.user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_stats" ON public.user_stats
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_stats" ON public.user_stats
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON public.materials(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON public.flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_user_id ON public.schedule_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcard_decks_updated_at BEFORE UPDATE ON public.flashcard_decks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
