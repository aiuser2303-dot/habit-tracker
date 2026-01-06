// Habits management
const Habits = {
  habits: [],
  completions: new Map(), // key: `${habitId}-${date}`, value: boolean
  
  async loadHabits(userId) {
    const { data, error } = await DB.getHabits(userId);
    if (error) {
      console.error('Error loading habits:', error);
      return [];
    }
    this.habits = data || [];
    return this.habits;
  },
  
  async loadCompletions(userId, startDate, endDate) {
    const { data, error } = await DB.getCompletions(userId, startDate, endDate);
    if (error) {
      console.error('Error loading completions:', error);
      return;
    }
    
    // Don't clear - merge with existing (for loading multiple date ranges)
    (data || []).forEach(c => {
      if (c.completed) {
        this.completions.set(`${c.habit_id}-${c.date}`, true);
      }
    });
  },
  
  async createHabit(userId, habitData) {
    const habit = {
      user_id: userId,
      name: habitData.name,
      description: habitData.description || null,
      category: habitData.category || 'other',
      monthly_goal: habitData.monthlyGoal || 20,
      color: habitData.color || CONFIG.HABIT_COLORS[0],
      icon: habitData.icon || null,
      is_active: true,
      sort_order: this.habits.length
    };
    
    const { data, error } = await DB.createHabit(habit);
    if (error) {
      console.error('Error creating habit:', error);
      return null;
    }
    
    this.habits.push(data);
    return data;
  },
  
  async updateHabit(habitId, updates) {
    const { data, error } = await DB.updateHabit(habitId, updates);
    if (error) {
      console.error('Error updating habit:', error);
      return null;
    }
    
    const index = this.habits.findIndex(h => h.id === habitId);
    if (index !== -1) {
      this.habits[index] = { ...this.habits[index], ...data };
    }
    
    return data;
  },
  
  async deleteHabit(habitId) {
    const { error } = await DB.deleteHabit(habitId);
    if (error) {
      console.error('Error deleting habit:', error);
      return false;
    }
    
    this.habits = this.habits.filter(h => h.id !== habitId);
    return true;
  },
  
  async toggleCompletion(habitId, userId, date) {
    const key = `${habitId}-${date}`;
    const currentValue = this.completions.get(key) || false;
    const newValue = !currentValue;
    
    // Optimistic update
    if (newValue) {
      this.completions.set(key, true);
    } else {
      this.completions.delete(key);
    }
    
    const { error } = await DB.toggleCompletion(habitId, userId, date, newValue);
    if (error) {
      // Revert on error
      if (currentValue) {
        this.completions.set(key, true);
      } else {
        this.completions.delete(key);
      }
      console.error('Error toggling completion:', error);
      return false;
    }
    
    return true;
  },
  
  isCompleted(habitId, date) {
    return this.completions.get(`${habitId}-${date}`) || false;
  },
  
  getActiveHabits() {
    return this.habits.filter(h => h.is_active);
  },
  
  getHabitById(habitId) {
    return this.habits.find(h => h.id === habitId);
  },
  
  // Get current week's date range (Sun-Sat)
  getCurrentWeekRange() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return { weekStart, weekEnd };
  },
  
  // Get days that have passed in current week (up to and including today)
  getPassedDaysInWeek() {
    const today = new Date();
    const todayStr = Calendar.formatDate(today);
    const { weekStart } = this.getCurrentWeekRange();
    
    const passedDays = [];
    for (let i = 0; i <= 6; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = Calendar.formatDate(date);
      
      if (dateStr <= todayStr) {
        passedDays.push(dateStr);
      }
    }
    
    return passedDays;
  },
  
  // Calculate completion rate for a habit in the CURRENT WEEK (only passed days)
  getCompletionRate(habitId) {
    const passedDays = this.getPassedDaysInWeek();
    
    if (passedDays.length === 0) return 0;
    
    const completed = passedDays.filter(d => this.isCompleted(habitId, d)).length;
    return Math.round((completed / passedDays.length) * 100);
  },
  
  // Get completion count for display (X/Y format for the week)
  getWeeklyCompletionCount(habitId) {
    const passedDays = this.getPassedDaysInWeek();
    const completed = passedDays.filter(d => this.isCompleted(habitId, d)).length;
    return { completed, total: passedDays.length };
  },
  
  // Calculate completion rate for a habit in a specific month
  getMonthlyCompletionRate(habitId, year, month) {
    const { start, end } = Calendar.getMonthDateRange(year, month);
    const days = Calendar.getDaysBetween(start, end);
    const today = Calendar.getToday();
    
    // Only count days up to today
    const relevantDays = days.filter(d => d <= today);
    if (relevantDays.length === 0) return 0;
    
    const completed = relevantDays.filter(d => this.isCompleted(habitId, d)).length;
    return Math.round((completed / relevantDays.length) * 100);
  },
  
  // Get streak for a specific habit
  getStreak(habitId) {
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);
    
    // Check if today is completed, if not start from yesterday
    const todayStr = Calendar.formatDate(today);
    if (!this.isCompleted(habitId, todayStr)) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    while (true) {
      const dateStr = Calendar.formatDate(currentDate);
      if (this.isCompleted(habitId, dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  },
  
  // Get today's stats
  getTodayStats() {
    const today = Calendar.getToday();
    const activeHabits = this.getActiveHabits();
    const completed = activeHabits.filter(h => this.isCompleted(h.id, today)).length;
    
    return {
      total: activeHabits.length,
      completed: completed,
      remaining: activeHabits.length - completed,
      rate: activeHabits.length > 0 ? Math.round((completed / activeHabits.length) * 100) : 0
    };
  },
  
  // Get current week's stats (only for days that have passed)
  getWeekStats() {
    const passedDays = this.getPassedDaysInWeek();
    const activeHabits = this.getActiveHabits();
    
    if (activeHabits.length === 0 || passedDays.length === 0) {
      return { completed: 0, total: 0, rate: 0, daysCount: 0 };
    }
    
    let totalCompleted = 0;
    const totalPossible = passedDays.length * activeHabits.length;
    
    passedDays.forEach(date => {
      activeHabits.forEach(habit => {
        if (this.isCompleted(habit.id, date)) {
          totalCompleted++;
        }
      });
    });
    
    return {
      completed: totalCompleted,
      total: totalPossible,
      rate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
      daysCount: passedDays.length
    };
  },
  
  // Get month stats (for the dashboard)
  getMonthStats(year, month) {
    const { start, end } = Calendar.getMonthDateRange(year, month);
    const days = Calendar.getDaysBetween(start, end);
    const today = Calendar.getToday();
    const activeHabits = this.getActiveHabits();
    
    if (activeHabits.length === 0) {
      return { completed: 0, total: 0, rate: 0, daysCount: 0 };
    }
    
    // Only count days up to today
    const relevantDays = days.filter(date => date <= today);
    
    if (relevantDays.length === 0) {
      return { completed: 0, total: 0, rate: 0, daysCount: 0 };
    }
    
    let totalCompleted = 0;
    const totalPossible = relevantDays.length * activeHabits.length;
    
    relevantDays.forEach(date => {
      activeHabits.forEach(habit => {
        if (this.isCompleted(habit.id, date)) {
          totalCompleted++;
        }
      });
    });
    
    return {
      completed: totalCompleted,
      total: totalPossible,
      rate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
      daysCount: relevantDays.length
    };
  },
  
  // Get overall streak (days where ALL habits were completed)
  getOverallStreak() {
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);
    const activeHabits = this.getActiveHabits();
    
    if (activeHabits.length === 0) return 0;
    
    // Check if today all habits are completed, if not start from yesterday
    const todayStr = Calendar.formatDate(today);
    const allCompletedToday = activeHabits.every(h => this.isCompleted(h.id, todayStr));
    
    if (!allCompletedToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    while (true) {
      const dateStr = Calendar.formatDate(currentDate);
      const allCompleted = activeHabits.every(h => this.isCompleted(h.id, dateStr));
      
      if (allCompleted) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }
};
