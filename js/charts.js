// Chart management
const Charts = {
  instances: {},
  isUpdating: false,
  
  // Destroy existing chart safely
  destroy(id) {
    if (this.instances[id]) {
      try {
        this.instances[id].destroy();
      } catch (e) {
        console.warn('Error destroying chart:', e);
      }
      delete this.instances[id];
    }
  },
  
  // Destroy all charts
  destroyAll() {
    Object.keys(this.instances).forEach(id => this.destroy(id));
  },
  
  // Weekly progress bar chart
  renderWeeklyChart(canvasId, year, month) {
    this.destroy(canvasId);
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Reset canvas
    const parent = canvas.parentElement;
    const newCanvas = document.createElement('canvas');
    newCanvas.id = canvasId;
    canvas.remove();
    parent.appendChild(newCanvas);
    
    const ctx = newCanvas.getContext('2d');
    if (!ctx) return;
    
    const dailyData = Analytics.getDailyData(year, month);
    const last7Days = dailyData.slice(-7);
    
    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: last7Days.map(d => Calendar.DAY_NAMES_SHORT[Calendar.parseDate(d.date).getDay()]),
        datasets: [{
          label: 'Completion %',
          data: last7Days.map(d => d.rate),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: value => value + '%'
            }
          }
        }
      }
    });
  },
  
  // Completion donut chart
  renderCompletionDonut(canvasId, year, month) {
    this.destroy(canvasId);
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Reset canvas
    const parent = canvas.parentElement;
    const newCanvas = document.createElement('canvas');
    newCanvas.id = canvasId;
    canvas.remove();
    parent.appendChild(newCanvas);
    
    const ctx = newCanvas.getContext('2d');
    if (!ctx) return;
    
    const stats = Habits.getMonthStats(year, month);
    const incomplete = Math.max(0, stats.total - stats.completed);
    
    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Incomplete'],
        datasets: [{
          data: [stats.completed || 0, incomplete],
          backgroundColor: ['#10B981', '#E5E7EB'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  },
  
  // Monthly trend line chart
  renderMonthlyTrend(canvasId, year, month) {
    this.destroy(canvasId);
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Reset canvas
    const parent = canvas.parentElement;
    const newCanvas = document.createElement('canvas');
    newCanvas.id = canvasId;
    canvas.remove();
    parent.appendChild(newCanvas);
    
    const ctx = newCanvas.getContext('2d');
    if (!ctx) return;
    
    const dailyData = Analytics.getDailyData(year, month);
    
    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dailyData.map(d => d.day),
        datasets: [{
          label: 'Daily Completion %',
          data: dailyData.map(d => d.rate),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: value => value + '%'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Day of Month'
            }
          }
        }
      }
    });
  },
  
  // Weekly comparison chart
  renderWeeklyComparison(canvasId) {
    this.destroy(canvasId);
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Reset canvas
    const parent = canvas.parentElement;
    const newCanvas = document.createElement('canvas');
    newCanvas.id = canvasId;
    canvas.remove();
    parent.appendChild(newCanvas);
    
    const ctx = newCanvas.getContext('2d');
    if (!ctx) return;
    
    const comparison = Analytics.getWeekComparison();
    
    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Last Week', 'This Week'],
        datasets: [{
          label: 'Completion Rate',
          data: [comparison.lastWeek.rate, comparison.thisWeek.rate],
          backgroundColor: ['#9CA3AF', '#3B82F6'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: value => value + '%'
            }
          }
        }
      }
    });
  },
  
  // Render top habits list
  renderTopHabits(containerId, year, month) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const topHabits = Analytics.getTopHabits(year, month, 5);
    
    if (topHabits.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No habits tracked yet</p></div>';
      return;
    }
    
    container.innerHTML = topHabits.map((habit, index) => `
      <div class="top-habit-item">
        <div class="top-habit-rank">${index + 1}</div>
        <div class="top-habit-info">
          <div class="top-habit-name">${habit.name}</div>
          <div class="top-habit-bar">
            <div class="top-habit-bar-fill" style="width: ${habit.rate}%; background: ${habit.color}"></div>
          </div>
        </div>
        <div class="top-habit-rate">${habit.rate}%</div>
      </div>
    `).join('');
  },
  
  // Render heatmap
  renderHeatmap(containerId, year) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const data = Analytics.getYearHeatmapData(year);
    
    // Create a map for quick lookup
    const dataMap = new Map(data.map(d => [d.date, d.level]));
    
    // Generate all weeks of the year
    let html = '';
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // Adjust to start from Sunday
    const firstSunday = new Date(startDate);
    firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());
    
    for (let d = new Date(firstSunday); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = Calendar.formatDate(d);
      const level = dataMap.get(dateStr) || 0;
      const isCurrentYear = d.getFullYear() === year;
      
      html += `<div class="heatmap-cell level-${isCurrentYear ? level : 0}" 
                    data-date="${dateStr}" 
                    data-tooltip="${dateStr}: ${level * 25}%"></div>`;
    }
    
    container.innerHTML = html;
  },
  
  // Update all charts
  updateAll(year, month) {
    this.renderWeeklyChart('weekly-chart', year, month);
    this.renderCompletionDonut('completion-donut', year, month);
    this.renderMonthlyTrend('monthly-trend-chart', year, month);
    this.renderWeeklyComparison('weekly-comparison-chart');
    this.renderTopHabits('top-habits-list', year, month);
    this.renderHeatmap('heatmap-container', year);
  }
};
