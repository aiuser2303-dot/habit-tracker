# Habit Tracker - Production Setup Guide

Complete guide to deploy your Habit Tracker with Vercel, Supabase, Google OAuth, and email reminders.

## Quick Start Checklist

- [ ] Create Supabase project
- [ ] Run SQL migration
- [ ] Set up Google OAuth
- [ ] Configure email provider (SendGrid or SMTP)
- [ ] Deploy to Vercel
- [ ] Add environment variables
- [ ] Test everything

---

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization, enter project name
4. Set a strong database password (save it!)
5. Select region closest to your users
6. Wait for project to initialize (~2 minutes)

### Run Database Migration
1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click "Run"
5. Verify tables created: profiles, habits, completions, achievements, email_logs

### Get API Keys
1. Go to **Settings > API**
2. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY` (keep secret!)

### Enable Google Auth
1. Go to **Authentication > Providers**
2. Find "Google" and enable it
3. You'll need Google OAuth credentials (see next section)
4. Add your Google Client ID and Secret
5. Copy the **Callback URL** shown (you'll need it for Google setup)

---

## 2. Google OAuth Setup

### Create OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Configure consent screen if prompted:
   - User Type: External
   - App name: "Habit Tracker"
   - Support email: your email
   - Authorized domains: your domain (optional)
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Habit Tracker Web"
   - Authorized JavaScript origins:
     - `http://localhost:8080` (for local dev)
     - `https://your-app.vercel.app` (your production URL)
   - Authorized redirect URIs:
     - `https://YOUR-PROJECT.supabase.co/auth/v1/callback` (from Supabase)

### Get Credentials
- Copy **Client ID** → `VITE_GOOGLE_CLIENT_ID`
- Copy **Client Secret** → Add to Supabase Google provider settings

---

## 3. Email Provider Setup

Choose ONE option:

### Option A: SendGrid (Recommended)
1. Create account at [sendgrid.com](https://sendgrid.com)
2. Go to **Settings > API Keys**
3. Create API Key with "Mail Send" permission
4. Copy key → `SENDGRID_API_KEY`

### Option B: Gmail SMTP
1. Enable 2-Factor Authentication on your Gmail
2. Go to [Google Account > Security](https://myaccount.google.com/security)
3. Under "2-Step Verification", click **App passwords**
4. Generate password for "Mail"
5. Use these settings:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### Option C: Other SMTP Providers
- **Mailgun**: `smtp.mailgun.org:587`
- **Amazon SES**: `email-smtp.us-east-1.amazonaws.com:587`
- **Outlook**: `smtp-mail.outlook.com:587`

---

## 4. Vercel Deployment

### Deploy from GitHub
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel auto-detects settings, click "Deploy"

### Add Environment Variables
In Vercel Dashboard > Your Project > **Settings > Environment Variables**:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | All |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | All |
| `SUPABASE_SERVICE_KEY` | Your service role key | All |
| `VITE_GOOGLE_CLIENT_ID` | Your Google Client ID | All |
| `SENDGRID_API_KEY` | Your SendGrid key | All |
| `EMAIL_FROM` | `Habit Tracker <noreply@yourdomain.com>` | All |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | All |
| `CRON_SECRET` | Random 32+ char string | All |

**Or for SMTP instead of SendGrid:**
| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | Your email |
| `SMTP_PASS` | Your app password |

### Update Frontend Config
Edit `js/config.js`:
```javascript
const CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  GOOGLE_CLIENT_ID: 'your-google-client-id.apps.googleusercontent.com',
  LOCAL_MODE: false, // IMPORTANT: Set to false for production!
  // ... rest of config
};
```

### Redeploy
After updating config, push to GitHub and Vercel will auto-redeploy.

---

## 5. Email Reminders Setup

Since Vercel has cron job limits, we'll use a free external service:

### Free External Cron (Recommended)
1. **Deploy your app to Vercel first** (steps 1-4 above)
2. **Follow the guide:** See `SETUP-CRON.md` for detailed instructions
3. **Use cron-job.org** (free, reliable)
4. **Set schedule:** Every hour (`0 * * * *`)
5. **Add security:** Use your `CRON_SECRET` in Authorization header

### Quick Setup:
1. Go to [cron-job.org](https://cron-job.org)
2. Create free account
3. Add cron job:
   - **URL:** `https://your-app.vercel.app/api/cron/send-reminders`
   - **Schedule:** Every hour
   - **Header:** `Authorization: Bearer YOUR_CRON_SECRET`

---

## 6. Testing

### Test Authentication
1. Visit your deployed app
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify profile created in Supabase

### Test Email
1. Log in to your app
2. Go to Settings
3. Click "Send Test Email"
4. Check your inbox

### Test Cron Job
```bash
curl -X GET https://your-app.vercel.app/api/cron/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Environment Variables Summary

### Required for Production
```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Google OAuth
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# Email (choose one)
SENDGRID_API_KEY=SG.xxx
# OR
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=app-password

# App
EMAIL_FROM=Habit Tracker <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=random-32-char-string
```

---

## Reminder System Details

### How It Works
1. Cron job runs every hour
2. For each user with reminders enabled:
   - Check if current hour matches their reminder time (in their timezone)
   - Calculate today's completion rate
   - If rate < threshold AND no email sent today → send reminder
   - If rate = 100% AND celebrations enabled → send celebration

### User Settings
Users can configure in Settings:
- **Reminder Enabled**: Toggle reminders on/off
- **Reminder Time**: When to receive reminder (default: 22:00)
- **Reminder Threshold**: Send if completion below this % (default: 70%)
- **Celebration Enabled**: Send email when 100% complete
- **Timezone**: For correct reminder timing

---

## Troubleshooting

### "Invalid token" on login
- Check SUPABASE_URL and ANON_KEY are correct
- Verify Google OAuth redirect URI matches Supabase callback URL

### Emails not sending
- Check SENDGRID_API_KEY or SMTP credentials
- Verify EMAIL_FROM is valid
- Check Vercel function logs for errors

### Cron not running
- Verify CRON_SECRET matches in Vercel env vars
- Check Vercel Cron logs in dashboard
- For external cron, verify Authorization header

### Google OAuth errors
- Verify redirect URIs in Google Console match exactly
- Check Client ID is correct in both Supabase and frontend config

---

## Security Notes

1. **Never commit secrets** - Use environment variables
2. **Keep service_role key secret** - Only use server-side
3. **Enable RLS** - Already configured in migration
4. **Use HTTPS** - Vercel provides this automatically
5. **Rotate keys** - Periodically update API keys
