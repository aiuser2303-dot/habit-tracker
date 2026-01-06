// Browser-based notification system
const Notifications = {
  permission: null,
  reminderInterval: null,
  
  async init() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Browser notifications not supported');
      return false;
    }
    
    // Request permission
    this.permission = await Notification.requestPermission();
    
    if (this.permission === 'granted') {
      this.startReminderCheck();
      return true;
    }
    
    return false;
  },
  
  startReminderCheck() {
    // Check every 5 minutes for reminder time
    this.reminderInterval = setInterval(() => {
      this.checkReminderTime();
    }, 5 * 60 * 1000); // 5 minutes
  },
  
  async checkReminderTime() {
    if (!UI.currentUser) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Get user's reminder settings
    const { data: profile } = await DB.getProfile(UI.currentUser.id);
    const reminderTime = profile?.reminder_time || '22:00';
    const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number);
    const threshold = profile?.reminder_threshold || 70;
    
    // Check if it's reminder time (within 5 minutes)
    if (currentHour === reminderHour && Math.abs(currentMinute - reminderMinute) <= 5) {
      const todayStats = Habits.getTodayStats();
      
      // Send notification if below threshold
      if (todayStats.rate < threshold && todayStats.total > 0) {
        this.showReminderNotification(todayStats);
      }
      // Send celebration if 100%
      else if (todayStats.rate === 100 && todayStats.total > 0) {
        this.showCelebrationNotification(todayStats);
      }
    }
  },
  
  showReminderNotification(stats) {
    if (this.permission !== 'granted') return;
    
    const notification = new Notification('📝 Habit Reminder', {
      body: `You have ${stats.remaining} habits left to complete today (${stats.rate}%)`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'habit-reminder',
      requireInteraction: true
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    // Auto close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  },
  
  showCelebrationNotification(stats) {
    if (this.permission !== 'granted') return;
    
    const notification = new Notification('🎉 Perfect Day!', {
      body: `Congratulations! You completed all ${stats.total} habits today!`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'habit-celebration',
      requireInteraction: true
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    setTimeout(() => notification.close(), 10000);
  },
  
  // Manual reminder check (called when user opens app)
  async checkMissedReminders() {
    if (!UI.currentUser) return;
    
    const todayStats = Habits.getTodayStats();
    const now = new Date();
    const currentHour = now.getHours();
    
    // Get user's reminder settings
    const { data: profile } = await DB.getProfile(UI.currentUser.id);
    const reminderTime = profile?.reminder_time || '22:00';
    const reminderHour = parseInt(reminderTime.split(':')[0]);
    const threshold = profile?.reminder_threshold || 70;
    
    // If it's past reminder time and completion is low, show gentle reminder
    if (currentHour > reminderHour && todayStats.rate < threshold && todayStats.total > 0) {
      UI.showToast(`💡 You have ${todayStats.remaining} habits left to complete today`, 'info');
    }
  },
  
  stop() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
  }
};