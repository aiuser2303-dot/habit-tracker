// Configuration
const CONFIG = {
  // Supabase credentials - Replace with your own for production
  // Or set via environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
  SUPABASE_URL: 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
  
  // Google OAuth Client ID (for Google Sign-In)
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID',
  
  // Local testing mode - set to false for production with Supabase
  LOCAL_MODE: true,
  
  // Default reminder settings
  DEFAULT_REMINDER_TIME: '22:00',
  DEFAULT_REMINDER_THRESHOLD: 70, // Send reminder if completion < 70%
  
  // Hardcoded test credentials for local development
  TEST_USERS: [
    {
      username: 'demo',
      password: 'demo123',
      id: 'user-demo-001',
      email: 'demo@habittracker.local',
      name: 'Demo User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
    },
    {
      username: 'admin',
      password: 'admin123',
      id: 'user-admin-001',
      email: 'admin@habittracker.local',
      name: 'Admin User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
    },
    {
      username: 'test',
      password: 'test123',
      id: 'user-test-001',
      email: 'test@habittracker.local',
      name: 'Test User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test'
    }
  ],
  
  // App settings
  APP_NAME: 'Habit Tracker',
  DEFAULT_REMINDER_TIME: '22:00',
  MAX_HABITS: 99,
  
  // Colors for habits
  HABIT_COLORS: [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ],
  
  // Categories
  CATEGORIES: [
    { id: 'health', name: 'Health', icon: '❤️' },
    { id: 'productivity', name: 'Productivity', icon: '⚡' },
    { id: 'learning', name: 'Learning', icon: '📚' },
    { id: 'mindfulness', name: 'Mindfulness', icon: '🧘' },
    { id: 'fitness', name: 'Fitness', icon: '💪' },
    { id: 'other', name: 'Other', icon: '📌' }
  ],
  
  // Achievement definitions
  ACHIEVEMENTS: [
    { id: 'first_habit', title: 'First Step', description: 'Create your first habit', icon: '🌱', type: 'milestone' },
    { id: 'streak_7', title: 'Week Warrior', description: '7 day streak', icon: '🔥', type: 'streak' },
    { id: 'streak_30', title: 'Monthly Master', description: '30 day streak', icon: '⭐', type: 'streak' },
    { id: 'streak_100', title: 'Century Club', description: '100 day streak', icon: '💯', type: 'streak' },
    { id: 'perfect_day', title: 'Perfect Day', description: 'Complete all habits in a day', icon: '✨', type: 'completion' },
    { id: 'perfect_week', title: 'Perfect Week', description: '100% completion for a week', icon: '🏆', type: 'completion' },
    { id: 'habits_10', title: 'Habit Builder', description: 'Track 10 habits', icon: '🏗️', type: 'milestone' },
    { id: 'habits_25', title: 'Habit Master', description: 'Track 25 habits', icon: '👑', type: 'milestone' }
  ],
  
  // Default sample habits for new users
  SAMPLE_HABITS: [
    { name: 'Morning Exercise', description: 'Start the day with 30 minutes of exercise', category: 'fitness', monthly_goal: 25, color: '#EF4444' },
    { name: 'Read 30 Minutes', description: 'Read books or articles for personal growth', category: 'learning', monthly_goal: 28, color: '#3B82F6' },
    { name: 'Drink 8 Glasses of Water', description: 'Stay hydrated throughout the day', category: 'health', monthly_goal: 30, color: '#06B6D4' },
    { name: 'Meditate', description: '10-15 minutes of mindfulness meditation', category: 'mindfulness', monthly_goal: 25, color: '#8B5CF6' },
    { name: 'No Social Media Before Noon', description: 'Avoid distractions in the morning', category: 'productivity', monthly_goal: 25, color: '#F59E0B' },
    { name: 'Journal', description: 'Write thoughts, gratitude, or reflections', category: 'mindfulness', monthly_goal: 20, color: '#EC4899' },
    { name: 'Walk 10,000 Steps', description: 'Stay active with daily walking', category: 'fitness', monthly_goal: 25, color: '#10B981' },
    { name: 'Learn Something New', description: 'Spend time on a new skill or topic', category: 'learning', monthly_goal: 20, color: '#6366F1' },
    { name: 'Healthy Breakfast', description: 'Start with a nutritious meal', category: 'health', monthly_goal: 28, color: '#84CC16' },
    { name: 'Sleep Before 11 PM', description: 'Get quality rest with early bedtime', category: 'health', monthly_goal: 25, color: '#F97316' },
    { name: 'No Junk Food', description: 'Avoid processed and unhealthy snacks', category: 'health', monthly_goal: 25, color: '#14B8A6' }
  ]
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.HABIT_COLORS);
Object.freeze(CONFIG.CATEGORIES);
Object.freeze(CONFIG.ACHIEVEMENTS);
Object.freeze(CONFIG.SAMPLE_HABITS);
