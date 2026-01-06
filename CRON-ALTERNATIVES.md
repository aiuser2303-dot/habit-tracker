# Free Cron Job Alternatives for Habit Tracker

Since Vercel Hobby plan only allows daily cron jobs, here are free alternatives for hourly email reminders:

## 🔧 **Current Setup (Vercel Hobby)**

**Schedule:** Daily at 10 PM UTC (`0 22 * * *`)
- ✅ Works with free Vercel plan
- ✅ Checks all users and sends emails based on their timezone
- ✅ Uses 1-hour window for reminder time matching
- ❌ Less precise timing (daily vs hourly)

## 🆓 **Free External Cron Services**

### 1. **cron-job.org** (Recommended)
- **Free tier:** Up to 5 cron jobs, 1-minute intervals
- **Setup:**
  1. Go to [cron-job.org](https://cron-job.org)
  2. Create free account
  3. Add new cron job:
     - **URL:** `https://your-app.vercel.app/api/cron/send-reminders`
     - **Schedule:** `0 * * * *` (every hour)
     - **Headers:** `Authorization: Bearer YOUR_CRON_SECRET`
  4. Enable and test

### 2. **EasyCron**
- **Free tier:** 1 cron job, 1-hour intervals
- **Setup:**
  1. Go to [easycron.com](https://www.easycron.com)
  2. Create free account
  3. Add cron job:
     - **URL:** `https://your-app.vercel.app/api/cron/send-reminders`
     - **When:** Every hour (`0 * * * *`)
     - **HTTP Headers:** `Authorization: Bearer YOUR_CRON_SECRET`

### 3. **Uptime Robot** (Creative Solution)
- **Free tier:** 50 monitors, 5-minute intervals
- **Setup:**
  1. Go to [uptimerobot.com](https://uptimerobot.com)
  2. Create "HTTP(s)" monitor
  3. **URL:** `https://your-app.vercel.app/api/cron/send-reminders`
  4. **Monitoring Interval:** 60 minutes
  5. **Custom HTTP Headers:** `Authorization: Bearer YOUR_CRON_SECRET`

### 4. **GitHub Actions** (For Developers)
```yaml
# .github/workflows/cron-reminder.yml
name: Send Habit Reminders
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call reminder endpoint
        run: |
          curl -X GET "https://your-app.vercel.app/api/cron/send-reminders" \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 🔄 **Hybrid Approach (Best of Both)**

Keep Vercel cron as backup + external service as primary:

1. **External cron** (hourly) → Primary reminder system
2. **Vercel cron** (daily at 10 PM) → Backup/cleanup

This ensures reliability even if external service fails.

## ⚙️ **Configuration Changes**

### For External Hourly Cron:
```json
// vercel.json - Remove or comment out crons section
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 22 * * *",
      "comment": "Backup daily reminder"
    }
  ]
}
```

### For Daily-Only Setup:
Keep current `vercel.json` with `0 22 * * *` schedule.

## 🧪 **Testing Your Cron**

```bash
# Test the endpoint manually
curl -X GET "https://your-app.vercel.app/api/cron/send-reminders" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check health
curl "https://your-app.vercel.app/api/health"
```

## 📊 **Monitoring**

- **Vercel Function Logs:** Check execution in Vercel dashboard
- **Email Logs:** Check `email_logs` table in Supabase
- **Health Check:** Use `/api/health` endpoint
- **Stats:** Use `/api/stats` for usage metrics

## 💡 **Recommendations**

1. **Start with Vercel daily cron** (simplest, works immediately)
2. **Add cron-job.org** for hourly precision if needed
3. **Monitor email delivery** through Supabase logs
4. **Consider upgrading to Vercel Pro** ($20/month) for native hourly crons

## 🔐 **Security Notes**

- Always use `CRON_SECRET` for external services
- Monitor for unusual activity in logs
- Rate limit the cron endpoint if needed
- Use HTTPS for all external cron calls

The current daily setup will work perfectly for most users since it checks all timezones and sends emails within a 1-hour window of each user's preferred time!