// Analytics calculations
const Analytics = {
  // Get daily completion data for charts
  getDailyData(year, month) {
    const { start, end } = Calendar.getMonthDateRange(year, month);
    const days = Calendar.getDaysBetween(start, end);
    const today = Calendar.getToday();
    const activeHabits = Habits.getActiveHabits();
    
    return days.map(date => {
      if (date > today) {
        return { date, completed: 0, total: 0, rate: 0 };
      }
      
      const completed = activeHabits.filter(h => Habits.isCompleted(h.id, date)).length;
      return {
        date,
        day: parseInt(date.split('-')[2]),
        completed,
        total: activeHabits.length,
        rate: activeHabits.length > 0 ? Math.round((completed / activeHabits.length) * 100) : 0
      };
    }).filter(d => d.date <= today);
  },
  
  // Get weekly aggregated data
  getWeeklyData(year, month) {
    const dailyData = this.getDailyData(year, month);
    const weeks = [];
    let currentWeek = [];
    
    dailyData.forEach((day, index) => {
      currentWeek.push(day);
      const date = Calendar.parseDate(day.date);
      
      // End of week (Saturday) or last day
      if (date.getDay() === 6 || index === dailyData.length - 1) {
        const weekCompleted = currentWeek.reduce((sum, d) => sum + d.completed, 0);
        const weekTotal = currentWeek.reduce((sum, d) => sum + d.total, 0);
        
        weeks.push({
          weekNumber: Calendar.getWeekNumber(date),
          days: currentWeek.length,
          completed: weekCompleted,
          total: weekTotal,
          rate: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0
        });
        
        currentWeek = [];
      }
    });
    
    return weeks;
  },
  
  // Get top performing habits (using weekly rate)
  getTopHabits(year, month, limit = 5) {
    const activeHabits = Habits.getActiveHabits();
    
    const habitStats = activeHabits.map(habit => ({
      id: habit.id,
      name: habit.name,
      color: habit.color,
      rate: Habits.getCompletionRate(habit.id), // Weekly rate
      streak: Habits.getStreak(habit.id)
    }));
    
    return habitStats
      .sort((a, b) => b.rate - a.rate)
      .slice(0, limit);
  },
  
  // Get heatmap data for the year
  getYearHeatmapData(year) {
    const data = [];
    const activeHabits = Habits.getActiveHabits();
    const today = Calendar.getToday();
    
    // Generate all days of the year
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = Calendar.getDaysInMonth(year, month);
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (dateStr > today) continue;
        
        const completed = activeHabits.filter(h => Habits.isCompleted(h.id, dateStr)).length;
        const rate = activeHabits.length > 0 ? completed / activeHabits.length : 0;
        
        // Determine level (0-4)
        let level = 0;
        if (rate > 0) level = 1;
        if (rate >= 0.25) level = 1;
        if (rate >= 0.5) level = 2;
        if (rate >= 0.75) level = 3;
        if (rate >= 1) level = 4;
        
        data.push({ date: dateStr, value: rate, level });
      }
    }
    
    return data;
  },
  
  // Get comparison data (this week vs last week)
  getWeekComparison() {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    
    const activeHabits = Habits.getActiveHabits();
    
    // This week stats
    const thisWeekDays = Calendar.getDaysBetween(
      Calendar.formatDate(thisWeekStart),
      Calendar.formatDate(today)
    );
    
    let thisWeekCompleted = 0;
    thisWeekDays.forEach(date => {
      activeHabits.forEach(h => {
        if (Habits.isCompleted(h.id, date)) thisWeekCompleted++;
      });
    });
    
    const thisWeekTotal = thisWeekDays.length * activeHabits.length;
    const thisWeekRate = thisWeekTotal > 0 ? Math.round((thisWeekCompleted / thisWeekTotal) * 100) : 0;
    
    // Last week stats
    const lastWeekDays = Calendar.getDaysBetween(
      Calendar.formatDate(lastWeekStart),
      Calendar.formatDate(lastWeekEnd)
    );
    
    let lastWeekCompleted = 0;
    lastWeekDays.forEach(date => {
      activeHabits.forEach(h => {
        if (Habits.isCompleted(h.id, date)) lastWeekCompleted++;
      });
    });
    
    const lastWeekTotal = lastWeekDays.length * activeHabits.length;
    const lastWeekRate = lastWeekTotal > 0 ? Math.round((lastWeekCompleted / lastWeekTotal) * 100) : 0;
    
    return {
      thisWeek: { completed: thisWeekCompleted, total: thisWeekTotal, rate: thisWeekRate },
      lastWeek: { completed: lastWeekCompleted, total: lastWeekTotal, rate: lastWeekRate },
      change: thisWeekRate - lastWeekRate
    };
  },
  
  // Get habit correlation (simplified)
  getHabitCorrelation(habitId1, habitId2, days = 30) {
    const dates = Calendar.getLastNDays(days);
    let both = 0, only1 = 0, only2 = 0, neither = 0;
    
    dates.forEach(date => {
      const h1 = Habits.isCompleted(habitId1, date);
      const h2 = Habits.isCompleted(habitId2, date);
      
      if (h1 && h2) both++;
      else if (h1) only1++;
      else if (h2) only2++;
      else neither++;
    });
    
    // Simple correlation coefficient
    const n = dates.length;
    const p1 = (both + only1) / n;
    const p2 = (both + only2) / n;
    const pBoth = both / n;
    
    if (p1 === 0 || p2 === 0 || p1 === 1 || p2 === 1) return 0;
    
    const correlation = (pBoth - p1 * p2) / Math.sqrt(p1 * (1 - p1) * p2 * (1 - p2));
    return Math.round(correlation * 100) / 100;
  }
};
