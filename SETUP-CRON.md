# 🕐 Setup Free Cron Job for Email Reminders

Since your Vercel account has reached the cron job limit, use this free external service:

## 🎯 **Quick Setup with cron-job.org (FREE)**

### Step 1: Create Account
1. Go to [cron-job.org](https://cron-job.org)
2. Click "Sign up for free"
3. Create account (no credit card needed)

### Step 2: Add Cron Job
1. Click "Create cronjob"
2. Fill in details:
   - **Title:** `Habit Tracker Reminders`
   - **Address (URL):** `https://your-app.vercel.app/api/scheduled/send-reminders`
   - **Schedule:** Select "Every hour" or use `0 * * * *`
   - **Enabled:** ✅ Check this box

### Step 3: Add Security Header
1. Click "Advanced" tab
2. In "Request headers" section:
   - **Name:** `Authorization`
   - **Value:** `Bearer YOUR_CRON_SECRET`
   - (Replace `YOUR_CRON_SECRET` with your actual secret from Vercel env vars)

### Step 4: Test & Enable
1. Click "Create cronjob"
2. Click "Execute now" to test
3. Check execution log for success

## 🔧 **Alternative: EasyCron (FREE)**

If cron-job.org doesn't work:

1. Go to [easycron.com](https://www.easycron.com)
2. Sign up for free account
3. Add cron job:
   - **Cron Expression:** `0 * * * *` (every hour)
   - **URL:** `https://your-app.vercel.app/api/cron/send-reminders`
   - **HTTP Method:** GET
   - **HTTP Headers:** `Authorization: Bearer YOUR_CRON_SECRET`

## 🧪 **Test Your Setup**

```bash
# Test the endpoint manually
curl -X GET "https://your-app.vercel.app/api/cron/send-reminders" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"

# Should return something like:
# {"success":true,"processed":0,"reminders_sent":0,"celebrations_sent":0}
```

## 📊 **Monitor Your Cron**

- **Execution logs:** Check cron-job.org dashboard
- **Email logs:** Check Supabase `email_logs` table
- **App health:** Visit `https://your-app.vercel.app/api/health`

## ⚠️ **Important Notes**

1. **Replace `YOUR_CRON_SECRET`** with your actual secret from Vercel environment variables
2. **Replace `your-app.vercel.app`** with your actual Vercel app URL
3. **Free tier limits:** cron-job.org allows 5 free cron jobs
4. **Backup option:** Keep the API endpoint - you can always call it manually

## 🎉 **You're Done!**

Your habit tracker will now send email reminders every hour to users based on their timezone and preferences. The external cron service will call your Vercel API endpoint automatically.

**No more Vercel cron job limits!** 🚀