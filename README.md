# Ultimate Habit Tracker

A comprehensive web application for tracking habits with digital automation and analog-style focus.

## Features

- 📊 Track up to 99 habits with automated analytics
- 📅 Smart calendar control with automatic date management
- 📈 Real-time visual analytics (line charts, donut charts, bar charts)
- 🔥 Streak tracking and completion rates
- 🏆 Achievement system and milestone tracking
- 🔐 Local authentication for testing (hardcoded credentials)
- 🔐 Google OAuth authentication (production)
- 📧 Daily email reminders at 10 PM
- 📱 Mobile-responsive design
- 💾 Offline capability with localStorage
- 🌙 Dark/Light theme support

## Quick Start (Local Testing)

### Option 1: Open directly in browser
Simply open `index.html` in your browser. No server required!

### Option 2: Use a local server
```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Test Credentials

For local testing, use these hardcoded credentials:

| Username | Password | Description |
|----------|----------|-------------|
| `demo`   | `demo123` | Demo User |
| `admin`  | `admin123` | Admin User |
| `test`   | `test123` | Test User |

## Project Structure

```
habit-tracker/
├── index.html          # Main HTML file
├── css/
│   ├── style.css       # Main styles
│   ├── components.css  # UI component styles
│   └── charts.css      # Chart-specific styles
├── js/
│   ├── config.js       # Configuration and test users
│   ├── supabase.js     # Auth and database functions
│   ├── database.js     # IndexedDB for offline support
│   ├── calendar.js     # Calendar utilities
│   ├── habits.js       # Habit management
│   ├── analytics.js    # Analytics calculations
│   ├── charts.js       # Chart rendering
│   ├── ui.js           # UI management
│   └── app.js          # Main application
├── api/
│   └── send-reminder.js # Email reminder API
└── supabase/
    └── migrations/     # Database migrations
```

## Features Overview

### Dashboard
- Quick overview of today's habits
- 7-day completion grid
- Weekly progress chart
- Completion rate donut chart
- Stats cards (completion rate, streak, today's progress)

### Habits Management
- Create, edit, and delete habits
- Set monthly goals
- Categorize habits (Health, Productivity, Learning, etc.)
- Custom colors for visual organization

### Analytics
- Monthly trend line chart
- Top performing habits
- Yearly heatmap calendar
- Week-over-week comparison
- Habit correlations

### Achievements
- Automatic milestone detection
- Streak achievements (7, 30, 100 days)
- Perfect day/week achievements
- Habit builder milestones

## Configuration

### Local Mode (Default)
The app runs in local mode by default, using localStorage for data persistence and hardcoded credentials for authentication.

To modify test users, edit `js/config.js`:

```javascript
TEST_USERS: [
  {
    username: 'demo',
    password: 'demo123',
    id: 'user-demo-001',
    email: 'demo@habittracker.local',
    name: 'Demo User',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
  }
]
```

### Production Mode (Supabase)
To use Supabase for production:

1. Set `LOCAL_MODE: false` in `js/config.js`
2. Add your Supabase credentials:
```javascript
SUPABASE_URL: 'your-supabase-url',
SUPABASE_ANON_KEY: 'your-anon-key'
```

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with CSS Variables
- **Charts**: Chart.js
- **Storage**: localStorage / IndexedDB
- **Backend**: Supabase (optional)
- **Email**: Vercel Serverless Functions (optional)

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT
