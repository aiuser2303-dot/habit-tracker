// Main Application
const App = {
  async init() {
    console.log('🚀 Initializing Habit Tracker...');
    
    // Initialize Supabase
    initSupabase();
    
    // Initialize UI
    UI.init();
    
    // Check authentication
    await this.checkAuth();
    
    // Listen for auth changes
    Auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        this.onUserSignedIn(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.onUserSignedOut();
      }
    });
    
    console.log('✅ Habit Tracker initialized');
  },
  
  async checkAuth() {
    const { session } = await Auth.getSession();
    
    if (session?.user) {
      await this.onUserSignedIn(session.user);
    } else {
      UI.showScreen('auth');
    }
  },
  
  async onUserSignedIn(user) {
    console.log('User signed in:', user.email);
    
    UI.setUser(user);
    UI.showScreen('app');
    
    // Load user data
    await this.loadUserData(user.id);
    
    // Update UI
    UI.updateCalendarDisplay();
    UI.renderHabitGrid();
    UI.renderHabitsList();
    UI.updateStats();
    UI.renderAchievements();
    
    // Initialize notifications
    await Notifications.init();
    
    // Check for missed reminders when app opens
    Notifications.checkMissedReminders();
    
    UI.showToast(`Welcome back, ${user.user_metadata?.full_name || user.email}!`, 'success');
  },
  
  onUserSignedOut() {
    console.log('User signed out');
    UI.setUser(null);
    UI.showScreen('auth');
    
    // Clear data
    Habits.habits = [];
    Habits.completions.clear();
  },
  
  async loadUserData(userId) {
    // Clear completions map before loading fresh data
    Habits.completions.clear();
    
    // Load habits
    await Habits.loadHabits(userId);
    
    // If no habits exist, create sample habits for new users (without sample completions)
    if (Habits.habits.length === 0 && CONFIG.SAMPLE_HABITS) {
      console.log('📝 Creating sample habits for new user...');
      for (const sampleHabit of CONFIG.SAMPLE_HABITS) {
        await Habits.createHabit(userId, {
          name: sampleHabit.name,
          description: sampleHabit.description,
          category: sampleHabit.category,
          monthlyGoal: sampleHabit.monthly_goal,
          color: sampleHabit.color
        });
      }
      console.log('✅ Sample habits created (no sample completions - start fresh!)');
    }
    
    // Load completions for current month
    const { start, end } = Calendar.getMonthDateRange(UI.currentYear, UI.currentMonth);
    await Habits.loadCompletions(userId, start, end);
    
    // Also load previous month for streak calculations
    const prevMonth = Calendar.navigateMonth(UI.currentYear, UI.currentMonth, 'prev');
    const prevRange = Calendar.getMonthDateRange(prevMonth.year, prevMonth.month);
    await Habits.loadCompletions(userId, prevRange.start, prevRange.end);
  }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
