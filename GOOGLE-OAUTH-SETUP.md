# 🔐 Google OAuth Setup Guide

## Step 1: Configure Google Cloud Console

### 1.1 Go to Google Cloud Console
- Visit: https://console.cloud.google.com
- Sign in with your Google account

### 1.2 Create/Select Project
- Click project dropdown (top left)
- Click "New Project" or select existing
- Name: "Habit Tracker"

### 1.3 Enable Google+ API
- Go to "APIs & Services" → "Library"
- Search for "Google+ API"
- Click and "Enable"

### 1.4 Create OAuth Credentials
- Go to "APIs & Services" → "Credentials"
- Click "Create Credentials" → "OAuth 2.0 Client ID"
- If prompted, configure consent screen first:
  - User Type: External
  - App name: "Habit Tracker"
  - User support email: your email
  - Developer contact: your email
  - Save and continue through all steps

### 1.5 Configure OAuth Client
- Application type: **Web application**
- Name: "Habit Tracker Web"
- Authorized JavaScript origins:
  - `https://habittracker-nu-khaki.vercel.app`
  - `http://localhost:8080` (for testing)
- Authorized redirect URIs:
  - `https://ucvkavzsfpuuqulrppzy.supabase.co/auth/v1/callback`

## Step 2: Configure Supabase

### 2.1 Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard/project/ucvkavzsfpuuqulrppzy
- Go to "Authentication" → "Providers"

### 2.2 Enable Google Provider
- Find "Google" in the list
- Toggle it ON
- Add your credentials:
  - **Client ID**: `16193545770-nfdlubn1oluogvp3pe551akdfu1pkflp.apps.googleusercontent.com`
  - **Client Secret**: `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`
- Click "Save"

### 2.3 Copy Redirect URL
- Copy the redirect URL shown: `https://ucvkavzsfpuuqulrppzy.supabase.co/auth/v1/callback`
- Make sure this matches what you added in Google Cloud Console

## Step 3: Test the Setup

### 3.1 Deploy Your App
- Make sure your app is deployed to Vercel
- URL: https://habittracker-nu-khaki.vercel.app

### 3.2 Test Google Sign-In
1. Open your app
2. Click "Sign in with Google"
3. Should redirect to Google login
4. After login, should redirect back to your app
5. Should see your profile and sample habits

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Check that redirect URI in Google Console exactly matches Supabase callback URL
- Make sure there are no extra spaces or characters

### Error: "unauthorized_client"
- Make sure Google+ API is enabled
- Check that Client ID and Secret are correct in Supabase

### Error: "access_denied"
- User cancelled login or app not approved
- Make sure OAuth consent screen is configured

### Sign-in button doesn't work
- Check browser console for errors
- Make sure `VITE_GOOGLE_CLIENT_ID` is set in Vercel environment variables
- Make sure `LOCAL_MODE` is set to `false` in config.js

## ✅ Final Checklist

- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth credentials created with correct redirect URIs
- [ ] Supabase Google provider enabled with correct credentials
- [ ] App deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] `LOCAL_MODE = false` in config.js
- [ ] Test Google sign-in works

Once complete, each Google account will get:
- ✅ Separate user profile
- ✅ 5 sample habits with realistic completion data
- ✅ Sample achievement
- ✅ Completely isolated data (RLS ensures privacy)