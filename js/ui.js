// UI Management
const UI = {
  currentUser: null,
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,
  editingHabitId: null,
  
  // Initialize UI
  init() {
    this.bindEvents();
    this.applyTheme();
  },
  
  // Bind all event listeners
  bindEvents() {
    // Auth - Local login
    document.getElementById('local-login-btn')?.addEventListener('click', () => this.handleLocalLogin());
    document.getElementById('login-username')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleLocalLogin();
    });
    document.getElementById('login-password')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleLocalLogin();
    });
    
    // Auth - Google
    document.getElementById('google-login-btn')?.addEventListener('click', () => this.handleLogin());
    document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout());
    
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    // Calendar navigation
    document.getElementById('prev-month')?.addEventListener('click', () => this.navigateMonth('prev'));
    document.getElementById('next-month')?.addEventListener('click', () => this.navigateMonth('next'));
    document.getElementById('today-btn')?.addEventListener('click', () => this.goToToday());
    
    // Modals
    document.getElementById('add-habit-btn')?.addEventListener('click', () => this.openHabitModal());
    document.getElementById('add-habit-btn-2')?.addEventListener('click', () => this.openHabitModal());
    document.getElementById('settings-btn')?.addEventListener('click', () => this.openSettingsModal());
    document.getElementById('reset-data-btn')?.addEventListener('click', () => this.resetAllData());
    document.getElementById('test-email-btn')?.addEventListener('click', () => this.sendTestEmail());
    document.getElementById('export-data-btn')?.addEventListener('click', () => this.exportData());
    document.getElementById('delete-account-btn')?.addEventListener('click', () => this.deleteAccount());
    
    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-cancel, .modal-overlay').forEach(el => {
      el.addEventListener('click', () => this.closeAllModals());
    });
    
    // Forms
    document.getElementById('habit-form')?.addEventListener('submit', (e) => this.handleHabitSubmit(e));
    document.getElementById('settings-form')?.addEventListener('submit', (e) => this.handleSettingsSubmit(e));
    
    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());
    
    // Prevent modal content clicks from closing
    document.querySelectorAll('.modal-content').forEach(el => {
      el.addEventListener('click', (e) => e.stopPropagation());
    });
  },
  
  // Auth handlers
  async handleLocalLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    if (!username || !password) {
      errorEl.textContent = 'Please enter username and password';
      errorEl.classList.remove('hidden');
      return;
    }
    
    const { data, error } = await Auth.signInWithCredentials(username, password);
    
    if (error) {
      errorEl.textContent = error.message;
      errorEl.classList.remove('hidden');
    } else if (data?.user) {
      errorEl.classList.add('hidden');
      await App.onUserSignedIn(data.user);
    }
  },
  
  async handleLogin() {
    const { data, error } = await Auth.signInWithGoogle();
    if (error) {
      this.showToast('Login failed: ' + error.message, 'error');
    }
  },
  
  async handleLogout() {
    const { error } = await Auth.signOut();
    if (error) {
      this.showToast('Logout failed', 'error');
    } else {
      this.showScreen('auth');
      this.currentUser = null;
    }
  },
  
  // Screen management
  showScreen(screen) {
    document.getElementById('auth-screen').classList.toggle('hidden', screen !== 'auth');
    document.getElementById('app-screen').classList.toggle('hidden', screen !== 'app');
  },
  
  // Tab switching
  switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add('active');
    document.getElementById(`${tabId}-tab`)?.classList.add('active');
    
    // Refresh charts when switching to analytics
    if (tabId === 'analytics') {
      Charts.updateAll(this.currentYear, this.currentMonth);
    }
  },
  
  // Calendar navigation
  navigateMonth(direction) {
    const result = Calendar.navigateMonth(this.currentYear, this.currentMonth, direction);
    this.currentYear = result.year;
    this.currentMonth = result.month;
    this.updateCalendarDisplay();
    this.loadMonthData();
  },
  
  goToToday() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth() + 1;
    this.updateCalendarDisplay();
    this.loadMonthData();
  },
  
  updateCalendarDisplay() {
    const monthName = Calendar.getMonthName(this.currentMonth);
    document.getElementById('current-month').textContent = `${monthName} ${this.currentYear}`;
  },
  
  // Load data for current month
  async loadMonthData() {
    if (!this.currentUser) return;
    
    const { start, end } = Calendar.getMonthDateRange(this.currentYear, this.currentMonth);
    await Habits.loadCompletions(this.currentUser.id, start, end);
    
    this.renderHabitGrid();
    this.updateStats();
    Charts.renderWeeklyChart('weekly-chart', this.currentYear, this.currentMonth);
    Charts.renderCompletionDonut('completion-donut', this.currentYear, this.currentMonth);
  },
  
  // Render habit grid - Excel-like weekly view with Sun-Sat columns
  renderHabitGrid() {
    const container = document.getElementById('habit-grid');
    if (!container) return;
    
    // Remove old event listener
    container.replaceWith(container.cloneNode(false));
    const newContainer = document.getElementById('habit-grid');
    
    const habits = Habits.getActiveHabits();
    const today = new Date();
    const todayStr = Calendar.getToday();
    
    // Get current week (Sun-Sat)
    const currentDay = today.getDay(); // 0 = Sunday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Generate week days
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDays.push({
        date: date,
        dateString: Calendar.formatDate(date),
        dayName: Calendar.DAY_NAMES[i],
        dayShort: Calendar.DAY_NAMES_SHORT[i],
        dayNum: date.getDate(),
        isToday: Calendar.formatDate(date) === todayStr,
        isFuture: Calendar.formatDate(date) > todayStr
      });
    }
    
    // Format date range header
    const startStr = `${weekStart.getDate()} ${Calendar.MONTH_NAMES[weekStart.getMonth()].slice(0, 3)}`;
    const endStr = `${weekEnd.getDate()} ${Calendar.MONTH_NAMES[weekEnd.getMonth()].slice(0, 3)}`;
    
    if (habits.length === 0) {
      newContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h3>No habits yet</h3>
          <p>Start tracking your first habit!</p>
          <button class="btn btn-primary" onclick="UI.openHabitModal()">+ Add Habit</button>
        </div>
      `;
      return;
    }
    
    // Build Excel-like table
    let html = `
      <table class="habit-table">
        <thead>
          <tr class="habit-table-header">
            <th class="habit-name-cell">
              <span class="week-range">${startStr} - ${endStr}</span>
            </th>
            ${weekDays.map(day => `
              <th class="day-header ${day.isToday ? 'today' : ''} ${day.isFuture ? 'future' : ''}">
                <span class="day-name">${day.dayName}</span>
                <span class="day-num">${day.dayNum}</span>
              </th>
            `).join('')}
            <th class="progress-header">%</th>
          </tr>
        </thead>
        <tbody class="habit-table-body">
    `;
    
    habits.forEach((habit, habitIndex) => {
      html += `
        <tr class="habit-table-row" data-habit-id="${habit.id}">
          <td class="habit-name-cell">
            <span class="habit-color-dot" style="background: ${habit.color}"></span>
            <span class="habit-label">${habit.name}</span>
          </td>
          ${weekDays.map((day, dayIndex) => {
            const isCompleted = Habits.isCompleted(habit.id, day.dateString);
            const checkboxId = `cb-${habitIndex}-${dayIndex}`;
            return `
              <td class="day-cell-wrapper">
                <input type="checkbox" 
                       id="${checkboxId}"
                       class="day-checkbox ${day.isToday ? 'today' : ''} ${day.isFuture ? 'future' : ''}"
                       data-habit-id="${habit.id}"
                       data-date="${day.dateString}"
                       ${isCompleted ? 'checked' : ''}
                       ${day.isFuture ? 'disabled' : ''}>
              </td>
            `;
          }).join('')}
          <td class="progress-cell">
            <span class="progress-value" id="progress-${habit.id}">${Habits.getWeeklyCompletionCount(habit.id).completed}/${Habits.getWeeklyCompletionCount(habit.id).total}</span>
          </td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
    
    newContainer.innerHTML = html;
    
    // Add individual change listeners to each checkbox
    newContainer.querySelectorAll('.day-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        const habitId = e.target.dataset.habitId;
        const date = e.target.dataset.date;
        const isChecked = e.target.checked;
        
        // Update the data without re-rendering
        await this.handleCheckboxChange(habitId, date, isChecked);
      });
    });
  },
  
  // Handle checkbox change without full re-render
  async handleCheckboxChange(habitId, date, isChecked) {
    if (!this.currentUser) return;
    
    // Update the completion in the data store
    const key = `${habitId}-${date}`;
    if (isChecked) {
      Habits.completions.set(key, true);
    } else {
      Habits.completions.delete(key);
    }
    
    // Save to database
    await DB.toggleCompletion(habitId, this.currentUser.id, date, isChecked);
    
    // Update just the progress for this habit
    const progressEl = document.getElementById(`progress-${habitId}`);
    if (progressEl) {
      const count = Habits.getWeeklyCompletionCount(habitId);
      progressEl.textContent = `${count.completed}/${count.total}`;
    }
    
    // Update stats
    this.updateStats();
    
    // Check for achievements
    this.checkAchievements();
  },
  
  // Toggle habit completion (called from other places, does full re-render)
  async toggleHabitDay(habitId, date) {
    if (!this.currentUser) return;
    
    await Habits.toggleCompletion(habitId, this.currentUser.id, date);
    this.renderHabitGrid();
    this.updateStats();
    
    // Check for achievements
    this.checkAchievements();
  },
  
  // Update stats display
  updateStats() {
    const todayStats = Habits.getTodayStats();
    const weekStats = Habits.getWeekStats();
    const streak = Habits.getOverallStreak();
    
    // Show week completion rate (more meaningful than month for weekly view)
    document.getElementById('stat-completion').textContent = weekStats.rate + '%';
    document.getElementById('stat-streak').textContent = streak;
    document.getElementById('stat-today').textContent = `${todayStats.completed}/${todayStats.total}`;
    document.getElementById('stat-total').textContent = Habits.getActiveHabits().length;
  },
  
  // Habit modal
  openHabitModal(habitId = null) {
    this.editingHabitId = habitId;
    const modal = document.getElementById('habit-modal');
    const title = document.getElementById('habit-modal-title');
    const form = document.getElementById('habit-form');
    
    if (habitId) {
      const habit = Habits.getHabitById(habitId);
      if (habit) {
        title.textContent = 'Edit Habit';
        document.getElementById('habit-name').value = habit.name;
        document.getElementById('habit-description').value = habit.description || '';
        document.getElementById('habit-category').value = habit.category;
        document.getElementById('habit-goal').value = habit.monthly_goal;
        document.getElementById('habit-color').value = habit.color;
      }
    } else {
      title.textContent = 'Add New Habit';
      form.reset();
      document.getElementById('habit-color').value = CONFIG.HABIT_COLORS[Math.floor(Math.random() * CONFIG.HABIT_COLORS.length)];
    }
    
    modal.classList.remove('hidden');
  },
  
  async handleHabitSubmit(e) {
    e.preventDefault();
    
    const habitData = {
      name: document.getElementById('habit-name').value.trim(),
      description: document.getElementById('habit-description').value.trim(),
      category: document.getElementById('habit-category').value,
      monthlyGoal: parseInt(document.getElementById('habit-goal').value),
      color: document.getElementById('habit-color').value
    };
    
    if (!habitData.name) {
      this.showToast('Please enter a habit name', 'error');
      return;
    }
    
    if (this.editingHabitId) {
      await Habits.updateHabit(this.editingHabitId, {
        name: habitData.name,
        description: habitData.description,
        category: habitData.category,
        monthly_goal: habitData.monthlyGoal,
        color: habitData.color
      });
      this.showToast('Habit updated!', 'success');
    } else {
      await Habits.createHabit(this.currentUser.id, habitData);
      this.showToast('Habit created!', 'success');
    }
    
    this.closeAllModals();
    this.renderHabitGrid();
    this.renderHabitsList();
    this.updateStats();
  },
  
  // Render habits list (manage tab)
  renderHabitsList() {
    const container = document.getElementById('habits-list');
    if (!container) return;
    
    const habits = Habits.habits;
    
    if (habits.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h3>No habits yet</h3>
          <p>Create your first habit to get started!</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = habits.map(habit => `
      <div class="habit-item" data-habit-id="${habit.id}">
        <div class="habit-item-left">
          <div class="habit-item-color" style="background: ${habit.color}"></div>
          <div class="habit-item-info">
            <h4>${habit.name}</h4>
            <p>${habit.category} • Goal: ${habit.monthly_goal} days/month</p>
          </div>
        </div>
        <div class="habit-item-actions">
          <button class="btn btn-sm btn-outline" onclick="UI.openHabitModal('${habit.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="UI.deleteHabit('${habit.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  },
  
  async deleteHabit(habitId) {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    
    await Habits.deleteHabit(habitId);
    this.showToast('Habit deleted', 'success');
    this.renderHabitGrid();
    this.renderHabitsList();
    this.updateStats();
  },
  
  // Settings modal
  openSettingsModal() {
    document.getElementById('settings-modal').classList.remove('hidden');
    this.loadSettings();
  },
  
  // Reset all data
  async resetAllData() {
    if (!confirm('Are you sure you want to delete ALL habits and completions? This cannot be undone!')) {
      return;
    }
    
    // Clear localStorage
    localStorage.removeItem('habits');
    localStorage.removeItem('completions');
    localStorage.removeItem('achievements');
    
    // Clear in-memory data
    Habits.habits = [];
    Habits.completions.clear();
    
    // Close modal and refresh
    this.closeAllModals();
    
    // Reload user data (will create fresh sample habits)
    if (this.currentUser) {
      await App.loadUserData(this.currentUser.id);
      this.renderHabitGrid();
      this.renderHabitsList();
      this.updateStats();
    }
    
    this.showToast('All data has been reset!', 'success');
  },
  
  async handleSettingsSubmit(e) {
    e.preventDefault();
    
    const settings = {
      reminder_enabled: document.getElementById('reminder-enabled').checked,
      reminder_time: document.getElementById('reminder-time').value,
      reminder_threshold: parseInt(document.getElementById('reminder-threshold').value) || 70,
      celebration_enabled: document.getElementById('celebration-enabled').checked,
      timezone: document.getElementById('timezone').value,
      week_start: parseInt(document.getElementById('week-start').value) || 0
    };
    
    if (this.currentUser) {
      await DB.updateProfile(this.currentUser.id, settings);
    }
    
    this.showToast('Settings saved!', 'success');
    this.closeAllModals();
  },
  
  // Load settings into form
  async loadSettings() {
    if (!this.currentUser) return;
    
    const { data: profile } = await DB.getProfile(this.currentUser.id);
    if (profile) {
      document.getElementById('reminder-enabled').checked = profile.reminder_enabled !== false;
      document.getElementById('reminder-time').value = profile.reminder_time || '22:00';
      document.getElementById('reminder-threshold').value = profile.reminder_threshold || 70;
      document.getElementById('celebration-enabled').checked = profile.celebration_enabled !== false;
      document.getElementById('timezone').value = profile.timezone || 'UTC';
      document.getElementById('week-start').value = profile.week_start || 0;
    }
  },
  
  // Send test email
  async sendTestEmail() {
    if (!this.currentUser) {
      this.showToast('Please log in first', 'error');
      return;
    }
    
    const btn = document.getElementById('test-email-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;
    
    try {
      // Get session token
      const { session } = await Auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session token');
      }
      
      const response = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showToast('Test email sent! Check your inbox.', 'success');
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Test email error:', error);
      this.showToast('Failed to send test email: ' + error.message, 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  },
  
  // Export user data
  async exportData() {
    if (!this.currentUser) {
      this.showToast('Please log in first', 'error');
      return;
    }
    
    const btn = document.getElementById('export-data-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Exporting...';
    btn.disabled = true;
    
    try {
      const { session } = await Auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session token');
      }
      
      const response = await fetch('/api/export-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habit-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showToast('Data exported successfully!', 'success');
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      this.showToast('Export failed: ' + error.message, 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  },
  
  // Delete account
  async deleteAccount() {
    if (!this.currentUser) {
      this.showToast('Please log in first', 'error');
      return;
    }
    
    const confirmed = confirm(
      'Are you sure you want to DELETE your account?\n\n' +
      'This will permanently delete:\n' +
      '• Your profile\n' +
      '• All habits\n' +
      '• All completion data\n' +
      '• All achievements\n\n' +
      'This action CANNOT be undone!'
    );
    
    if (!confirmed) return;
    
    const doubleConfirm = prompt(
      'Type "DELETE_MY_ACCOUNT" to confirm account deletion:'
    );
    
    if (doubleConfirm !== 'DELETE_MY_ACCOUNT') {
      this.showToast('Account deletion cancelled', 'info');
      return;
    }
    
    const btn = document.getElementById('delete-account-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Deleting...';
    btn.disabled = true;
    
    try {
      const { session } = await Auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session token');
      }
      
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirm: 'DELETE_MY_ACCOUNT' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showToast('Account deleted successfully', 'success');
        // Sign out and redirect
        await this.handleLogout();
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      this.showToast('Delete failed: ' + error.message, 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  },
  
  // Close all modals
  closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    this.editingHabitId = null;
  },
  
  // Theme
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const btn = document.getElementById('theme-toggle');
    btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  },
  
  applyTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  },
  
  // Toast notifications
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  
  // Achievements
  async checkAchievements() {
    // Check for perfect day
    const todayStats = Habits.getTodayStats();
    if (todayStats.total > 0 && todayStats.completed === todayStats.total) {
      // Award perfect day achievement if not already earned today
      this.showToast('🎉 Perfect Day! All habits completed!', 'success');
    }
  },
  
  // Render achievements
  async renderAchievements() {
    const container = document.getElementById('achievements-grid');
    if (!container || !this.currentUser) return;
    
    const { data: earned } = await DB.getAchievements(this.currentUser.id);
    const earnedIds = new Set((earned || []).map(a => a.title));
    
    container.innerHTML = CONFIG.ACHIEVEMENTS.map(achievement => {
      const isEarned = earnedIds.has(achievement.title);
      return `
        <div class="achievement-card ${isEarned ? '' : 'locked'}">
          <div class="achievement-icon">${achievement.icon}</div>
          <div class="achievement-info">
            <h4>${achievement.title}</h4>
            <p>${achievement.description}</p>
          </div>
        </div>
      `;
    }).join('');
  },
  
  // Set user and update UI
  setUser(user) {
    this.currentUser = user;
    
    if (user) {
      const avatar = document.getElementById('user-avatar');
      if (avatar) {
        avatar.src = user.user_metadata?.avatar_url || 
                     `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
      }
    }
  }
};
