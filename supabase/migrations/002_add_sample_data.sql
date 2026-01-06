-- ============================================
-- ADD SAMPLE DATA FUNCTIONALITY TO EXISTING DATABASE
-- ============================================
-- Run this AFTER you've already run the initial schema

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
    (p_user_id, 'Journal', 'Write thoughts, gratitude, or reflections', 'mindfulness', '#EC4899', 20, 4);

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
-- UPDATE EXISTING TRIGGER TO INCLUDE SAMPLE DATA
-- ============================================
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with sample data creation
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- OPTIONAL: CREATE SAMPLE DATA FOR EXISTING USERS
-- ============================================
-- Uncomment and run this if you want to add sample data to existing users
-- (Replace 'your-user-id-here' with actual user ID from auth.users table)

/*
-- To see existing users:
-- SELECT id, email FROM auth.users;

-- To add sample data to a specific existing user:
-- SELECT public.create_sample_data('your-user-id-here');

-- To add sample data to ALL existing users (be careful!):
-- DO $$
-- DECLARE
--   user_record RECORD;
-- BEGIN
--   FOR user_record IN SELECT id FROM auth.users LOOP
--     -- Only create sample data if user has no habits yet
--     IF NOT EXISTS (SELECT 1 FROM public.habits WHERE user_id = user_record.id) THEN
--       PERFORM public.create_sample_data(user_record.id);
--     END IF;
--   END LOOP;
-- END $$;
*/