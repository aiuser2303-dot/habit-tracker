-- ===========================================
-- HABIT TRACKER - COMPLETE SUPABASE SCHEMA
-- ===========================================
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Email reminder settings
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '22:00:00',
  reminder_threshold INTEGER DEFAULT 70, -- Send reminder if completion < this %
  celebration_enabled BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'UTC',
  
  -- Preferences
  week_start INTEGER DEFAULT 0, -- 0 = Sunday, 1 = Monday
  theme TEXT DEFAULT 'auto',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HABITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'other',
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  
  monthly_goal INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLETIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT true,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one completion per habit per day
  UNIQUE(habit_id, date)
);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  achievement_id TEXT NOT NULL, -- e.g., 'streak_7', 'perfect_day'
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate achievements
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- EMAIL LOGS TABLE (for tracking sent emails)
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  email_type TEXT NOT NULL, -- 'reminder', 'celebration', 'weekly_summary', 'test'
  subject TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message TEXT,
  
  -- Metadata
  completion_rate INTEGER,
  habits_completed INTEGER,
  habits_total INTEGER
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_active ON public.habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_completions_user_date ON public.completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON public.completions(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON public.email_logs(user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_type_date ON public.email_logs(user_id, email_type, sent_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can view own completions" ON public.completions;
DROP POLICY IF EXISTS "Users can insert own completions" ON public.completions;
DROP POLICY IF EXISTS "Users can update own completions" ON public.completions;
DROP POLICY IF EXISTS "Users can delete own completions" ON public.completions;
DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Habits policies
CREATE POLICY "Users can view own habits" ON public.habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" ON public.habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON public.habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON public.habits
  FOR DELETE USING (auth.uid() = user_id);

-- Completions policies
CREATE POLICY "Users can view own completions" ON public.completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" ON public.completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions" ON public.completions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" ON public.completions
  FOR DELETE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Email logs policies (users can view, service role can insert)
CREATE POLICY "Users can view own email logs" ON public.email_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create sample data for new user
  PERFORM public.create_sample_data(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- HELPER FUNCTION: Get users needing reminders
-- Called by the cron job / Vercel function
-- ============================================
CREATE OR REPLACE FUNCTION public.get_users_for_reminder(target_hour INTEGER DEFAULT 22)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  reminder_threshold INTEGER,
  timezone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    p.reminder_threshold,
    p.timezone
  FROM public.profiles p
  WHERE p.reminder_enabled = true
    AND EXTRACT(HOUR FROM (NOW() AT TIME ZONE COALESCE(p.timezone, 'UTC'))) = target_hour
    AND p.email IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Get user's daily completion rate
-- ============================================
CREATE OR REPLACE FUNCTION public.get_daily_completion_rate(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_habits INTEGER,
  completed_habits INTEGER,
  completion_rate INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH habit_count AS (
    SELECT COUNT(*)::INTEGER as total
    FROM public.habits
    WHERE user_id = p_user_id AND is_active = true
  ),
  completion_count AS (
    SELECT COUNT(*)::INTEGER as completed
    FROM public.completions c
    JOIN public.habits h ON c.habit_id = h.id
    WHERE c.user_id = p_user_id 
      AND c.date = p_date 
      AND c.completed = true
      AND h.is_active = true
  )
  SELECT 
    hc.total as total_habits,
    cc.completed as completed_habits,
    CASE 
      WHEN hc.total > 0 THEN ROUND((cc.completed::NUMERIC / hc.total) * 100)::INTEGER
      ELSE 0
    END as completion_rate
  FROM habit_count hc, completion_count cc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Get incomplete habits for a user
-- ============================================
CREATE OR REPLACE FUNCTION public.get_incomplete_habits(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  habit_id UUID,
  habit_name TEXT,
  category TEXT,
  color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id as habit_id,
    h.name as habit_name,
    h.category,
    h.color
  FROM public.habits h
  LEFT JOIN public.completions c ON h.id = c.habit_id AND c.date = p_date AND c.completed = true
  WHERE h.user_id = p_user_id 
    AND h.is_active = true
    AND c.id IS NULL
  ORDER BY h.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if email was sent today
-- ============================================
CREATE OR REPLACE FUNCTION public.email_sent_today(p_user_id UUID, p_email_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.email_logs
    WHERE user_id = p_user_id
      AND email_type = p_email_type
      AND sent_at::DATE = CURRENT_DATE
      AND status = 'sent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAMPLE DATA FUNCTION FOR NEW USERS
-- ============================================
CREATE OR REPLACE FUNCTION public.create_sample_data(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  habit_ids UUID[];
  habit_id UUID;
  sample_date DATE;
  i INTEGER;
BEGIN
  -- Create sample habits
  INSERT INTO public.habits (user_id, name, description, category, color, monthly_goal, sort_order)
  VALUES 
    (p_user_id, 'Morning Exercise', 'Start the day with 30 minutes of exercise', 'fitness', '#EF4444', 25, 0),
    (p_user_id, 'Read 30 Minutes', 'Read books or articles for personal growth', 'learning', '#3B82F6', 28, 1),
    (p_user_id, 'Drink 8 Glasses of Water', 'Stay hydrated throughout the day', 'health', '#06B6D4', 30, 2),
    (p_user_id, 'Meditate', '10-15 minutes of mindfulness meditation', 'mindfulness', '#8B5CF6', 25, 3),
    (p_user_id, 'Journal', 'Write thoughts, gratitude, or reflections', 'mindfulness', '#EC4899', 20, 4)
  RETURNING id INTO habit_ids;

  -- Get all created habit IDs
  SELECT ARRAY(
    SELECT id FROM public.habits 
    WHERE user_id = p_user_id 
    ORDER BY sort_order
  ) INTO habit_ids;

  -- Create sample completions for the last 7 days
  FOR i IN 0..6 LOOP
    sample_date := CURRENT_DATE - i;
    
    -- Randomly complete some habits for each day (simulate realistic usage)
    FOREACH habit_id IN ARRAY habit_ids LOOP
      -- 70% chance of completion for each habit each day
      IF random() < 0.7 THEN
        INSERT INTO public.completions (habit_id, user_id, date, completed)
        VALUES (habit_id, p_user_id, sample_date, true)
        ON CONFLICT (habit_id, date) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Create a sample achievement
  INSERT INTO public.achievements (user_id, achievement_id, title, description, icon)
  VALUES (p_user_id, 'first_habit', 'First Step', 'Created your first habit', '🌱')
  ON CONFLICT (user_id, achievement_id) DO NOTHING;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- Uncomment to add sample data
-- ============================================
/*
-- Insert sample habits for testing (replace USER_ID with actual user ID)
INSERT INTO public.habits (user_id, name, description, category, color, monthly_goal) VALUES
  ('USER_ID', 'Morning Exercise', 'Start the day with 30 minutes of exercise', 'fitness', '#EF4444', 25),
  ('USER_ID', 'Read 30 Minutes', 'Read books or articles for personal growth', 'learning', '#3B82F6', 28),
  ('USER_ID', 'Drink 8 Glasses of Water', 'Stay hydrated throughout the day', 'health', '#06B6D4', 30),
  ('USER_ID', 'Meditate', '10-15 minutes of mindfulness meditation', 'mindfulness', '#8B5CF6', 25);
*/

-- ============================================
-- GRANT PERMISSIONS FOR SERVICE ROLE
-- (Needed for Vercel serverless functions)
-- ============================================
-- Service role can bypass RLS, but we need to ensure functions are accessible
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;