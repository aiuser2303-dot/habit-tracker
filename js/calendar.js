// Calendar utilities
const Calendar = {
  MONTH_NAMES: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  
  DAY_NAMES: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  DAY_NAMES_SHORT: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  
  getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  },
  
  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  },
  
  getFirstDayOfMonth(year, month) {
    return new Date(year, month - 1, 1).getDay();
  },
  
  formatDate(date) {
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  },
  
  parseDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  },
  
  getToday() {
    return this.formatDate(new Date());
  },
  
  getMonthDateRange(year, month) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-${this.getDaysInMonth(year, month)}`;
    return { start, end };
  },
  
  generateMonthDays(year, month) {
    const days = [];
    const daysInMonth = this.getDaysInMonth(year, month);
    const today = this.getToday();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(year, month - 1, day);
      
      days.push({
        date: date,
        dateString: dateString,
        dayOfMonth: day,
        dayOfWeek: date.getDay(),
        isToday: dateString === today,
        isPast: dateString < today,
        isFuture: dateString > today
      });
    }
    
    return days;
  },
  
  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  },
  
  navigateMonth(year, month, direction) {
    if (direction === 'prev') {
      return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
    }
    return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  },
  
  getMonthName(month) {
    return this.MONTH_NAMES[month - 1];
  },
  
  getDayName(dayOfWeek) {
    return this.DAY_NAMES[dayOfWeek];
  },
  
  // Get last N days
  getLastNDays(n) {
    const days = [];
    const today = new Date();
    
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(this.formatDate(date));
    }
    
    return days;
  },
  
  // Get days between two dates
  getDaysBetween(startDate, endDate) {
    const days = [];
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(this.formatDate(new Date(d)));
    }
    
    return days;
  }
};
