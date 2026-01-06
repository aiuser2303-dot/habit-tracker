// Supabase Client
let supabaseClient = null;

function initSupabase() {
  // Check if we're in local mode
  if (CONFIG.LOCAL_MODE) {
    console.log('🔧 Running in LOCAL MODE - using hardcoded credentials');
    return null;
  }
  
  if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.warn('Supabase not configured. Running in demo mode.');
    return null;
  }
  
  supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  return supabaseClient;
}

// Auth functions
const Auth = {
  // Local authentication with hardcoded credentials
  async signInWithCredentials(username, password) {
    if (CONFIG.LOCAL_MODE) {
      const user = CONFIG.TEST_USERS.find(
        u => u.username === username && u.password === password
      );
      
      if (user) {
        const sessionUser = {
          id: user.id,
          email: user.email,
          user_metadata: {
            full_name: user.name,
            avatar_url: user.avatar
          }
        };
        localStorage.setItem('local_user', JSON.stringify(sessionUser));
        return { data: { user: sessionUser }, error: null };
      } else {
        return { data: null, error: { message: 'Invalid username or password' } };
      }
    }
    
    // Supabase email/password auth (if configured)
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: username,
        password: password
      });
      return { data, error };
    }
    
    return { data: null, error: { message: 'Authentication not configured' } };
  },
  
  async signInWithGoogle() {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      // Demo mode - create fake user
      const demoUser = {
        id: 'demo-user',
        email: 'demo@example.com',
        user_metadata: {
          full_name: 'Demo User',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
        }
      };
      localStorage.setItem('local_user', JSON.stringify(demoUser));
      return { data: { user: demoUser }, error: null };
    }
    
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    return { data, error };
  },
  
  async signOut() {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      localStorage.removeItem('local_user');
      return { error: null };
    }
    
    const { error } = await supabaseClient.auth.signOut();
    return { error };
  },
  
  async getUser() {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      const localUser = localStorage.getItem('local_user');
      return { user: localUser ? JSON.parse(localUser) : null, error: null };
    }
    
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    return { user, error };
  },
  
  async getSession() {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      const localUser = localStorage.getItem('local_user');
      return { session: localUser ? { user: JSON.parse(localUser) } : null, error: null };
    }
    
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    return { session, error };
  },
  
  onAuthStateChange(callback) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      // Local mode - check localStorage
      const checkAuth = () => {
        const localUser = localStorage.getItem('local_user');
        if (localUser) {
          callback('SIGNED_IN', { user: JSON.parse(localUser) });
        }
      };
      checkAuth();
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    
    return supabaseClient.auth.onAuthStateChange(callback);
  }
};

// Database functions
const DB = {
  // Profiles
  async getProfile(userId) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) return { data: null, error: null };
    
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },
  
  async updateProfile(userId, updates) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      const profiles = JSON.parse(localStorage.getItem('profiles') || '{}');
      profiles[userId] = { ...profiles[userId], ...updates };
      localStorage.setItem('profiles', JSON.stringify(profiles));
      return { error: null };
    }
    
    const { error } = await supabaseClient
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    return { error };
  },
  
  // Habits
  async getHabits(userId) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      const habits = JSON.parse(localStorage.getItem('habits') || '[]');
      return { data: habits.filter(h => h.user_id === userId), error: null };
    }
    
    const { data, error } = await supabaseClient
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });
    return { data, error };
  },
  
  async createHabit(habit) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      const habits = JSON.parse(localStorage.getItem('habits') || '[]');
      const newHabit = { ...habit, id: 'habit-' + Date.now(), created_at: new Date().toISOString() };
      habits.push(newHabit);
      localStorage.setItem('habits', JSON.stringify(habits));
      return { data: newHabit, error: null };
    }
    
    const { data, error } = await supabaseClient
      .from('habits')
      .insert(habit)
      .select()
      .single();
    return { data, error };
  },
  
  async updateHabit(habitId, updates) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      const habits = JSON.parse(localStorage.getItem('habits') || '[]');
      const index = habits.findIndex(h => h.id === habitId);
      if (index !== -1) {
        habits[index] = { ...habits[index], ...updates };
        localStorage.setItem('habits', JSON.stringify(habits));
        return { data: habits[index], error: null };
      }
      return { data: null, error: { message: 'Habit not found' } };
    }
    
    const { data, error } = await supabaseClient
      .from('habits')
      .update(updates)
      .eq('id', habitId)
      .select()
      .single();
    return { data, error };
  },
  
  async deleteHabit(habitId) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      const habits = JSON.parse(localStorage.getItem('habits') || '[]');
      const filtered = habits.filter(h => h.id !== habitId);
      localStorage.setItem('habits', JSON.stringify(filtered));
      return { error: null };
    }
    
    const { error } = await supabaseClient
      .from('habits')
      .delete()
      .eq('id', habitId);
    return { error };
  },
  
  // Completions
  async getCompletions(userId, startDate, endDate) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      const completions = JSON.parse(localStorage.getItem('completions') || '[]');
      return {
        data: completions.filter(c => 
          c.user_id === userId && 
          c.date >= startDate && 
          c.date <= endDate
        ),
        error: null
      };
    }
    
    const { data, error } = await supabaseClient
      .from('completions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);
    return { data, error };
  },
  
  async toggleCompletion(habitId, userId, date, completed) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      let completions = JSON.parse(localStorage.getItem('completions') || '[]');
      const index = completions.findIndex(c => c.habit_id === habitId && c.date === date);
      
      if (completed) {
        // Adding completion
        if (index !== -1) {
          completions[index].completed = true;
        } else {
          completions.push({
            id: 'completion-' + Date.now(),
            habit_id: habitId,
            user_id: userId,
            date: date,
            completed: true,
            created_at: new Date().toISOString()
          });
        }
      } else {
        // Removing completion - delete the record entirely
        if (index !== -1) {
          completions.splice(index, 1);
        }
      }
      
      localStorage.setItem('completions', JSON.stringify(completions));
      return { data: { habit_id: habitId, date, completed }, error: null };
    }
    
    // Check if exists
    const { data: existing } = await supabaseClient
      .from('completions')
      .select('*')
      .eq('habit_id', habitId)
      .eq('date', date)
      .single();
    
    if (existing) {
      const { data, error } = await supabaseClient
        .from('completions')
        .update({ completed })
        .eq('id', existing.id)
        .select()
        .single();
      return { data, error };
    } else {
      const { data, error } = await supabaseClient
        .from('completions')
        .insert({ habit_id: habitId, user_id: userId, date, completed })
        .select()
        .single();
      return { data, error };
    }
  },
  
  // Achievements
  async getAchievements(userId) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
      return { data: achievements.filter(a => a.user_id === userId), error: null };
    }
    
    const { data, error } = await supabaseClient
      .from('achievements')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },
  
  async createAchievement(achievement) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
      const newAchievement = { ...achievement, id: 'achievement-' + Date.now() };
      achievements.push(newAchievement);
      localStorage.setItem('achievements', JSON.stringify(achievements));
      return { data: newAchievement, error: null };
    }
    
    const { data, error } = await supabaseClient
      .from('achievements')
      .insert(achievement)
      .select()
      .single();
    return { data, error };
  },
  
  // Settings
  async getSettings(userId) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      const settings = JSON.parse(localStorage.getItem('settings') || '{}');
      return { data: settings[userId] || null, error: null };
    }
    
    const { data, error } = await supabaseClient
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },
  
  async updateSettings(userId, updates) {
    if (CONFIG.LOCAL_MODE || !supabaseClient) {
      const settings = JSON.parse(localStorage.getItem('settings') || '{}');
      settings[userId] = { ...settings[userId], ...updates, user_id: userId };
      localStorage.setItem('settings', JSON.stringify(settings));
      return { error: null };
    }
    
    const { error } = await supabaseClient
      .from('user_settings')
      .upsert({ user_id: userId, ...updates });
    return { error };
  }
};
