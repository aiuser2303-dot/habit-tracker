// ===========================================
// VERCEL CRON JOB: Send Habit Reminders
// ===========================================
// Runs every hour and checks which users need reminders
// based on their timezone and reminder settings

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service key for server-side operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ===========================================
// EMAIL SENDING (SendGrid or SMTP)
// ===========================================
async function sendEmail(to, subject, htmlContent, textContent) {
  // Try SendGrid first
  if (process.env.SENDGRID_API_KEY) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { 
          email: process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'noreply@habittracker.app',
          name: process.env.EMAIL_FROM?.match(/^([^<]+)/)?.[1]?.trim() || 'Habit Tracker'
        },
        subject: subject,
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent }
        ]
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid error: ${response.status} - ${error}`);
    }
    return { success: true, provider: 'sendgrid' };
  }
  
  // Fallback to SMTP via Nodemailer
  if (process.env.SMTP_HOST) {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent
    });
    
    return { success: true, provider: 'smtp' };
  }
  
  throw new Error('No email provider configured. Set SENDGRID_API_KEY or SMTP_* variables.');
}

// ===========================================
// EMAIL TEMPLATES
// ===========================================
function generateReminderEmail(userName, incompleteHabits, completionRate, threshold) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://habittracker.app';
  
  const habitsList = incompleteHabits
    .map(h => `
      <li style="margin: 8px 0; padding: 12px; background: #f3f4f6; border-radius: 6px; border-left: 4px solid ${h.color || '#3B82F6'};">
        <strong>${h.habit_name}</strong>
        ${h.category ? `<span style="color: #6b7280; font-size: 12px; margin-left: 8px;">${h.category}</span>` : ''}
      </li>
    `)
    .join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">📊</span>
      <h1 style="margin: 16px 0 8px; color: #111827; font-size: 24px;">Daily Habit Reminder</h1>
      <p style="color: #6b7280; margin: 0;">Hey ${userName || 'there'}! Don't forget your habits today.</p>
    </div>
    
    <div style="background: linear-gradient(135deg, ${completionRate < 50 ? '#EF4444, #DC2626' : '#F59E0B, #D97706'}); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 42px; font-weight: bold;">${completionRate}%</div>
      <div style="opacity: 0.9; font-size: 14px;">Today's Completion Rate</div>
      <div style="font-size: 12px; opacity: 0.8; margin-top: 8px;">Your target: ${threshold}%</div>
    </div>
    
    <h3 style="color: #111827; margin-bottom: 12px; font-size: 16px;">⏰ Incomplete Habits (${incompleteHabits.length})</h3>
    <ul style="list-style: none; padding: 0; margin: 0 0 24px;">
      ${habitsList}
    </ul>
    
    <div style="text-align: center;">
      <a href="${appUrl}" 
         style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Complete Your Habits →
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      You're receiving this because you enabled daily reminders at ${threshold}% threshold.<br>
      <a href="${appUrl}" style="color: #6b7280;">Manage your notification preferences</a>
    </p>
  </div>
</body>
</html>
  `;
}

function generateCelebrationEmail(userName, completedCount) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://habittracker.app';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center;">
      <span style="font-size: 72px;">🎉</span>
      <h1 style="margin: 16px 0 8px; color: #111827; font-size: 28px;">Perfect Day!</h1>
      <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px;">Congratulations ${userName || 'Champion'}!</p>
      
      <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <div style="font-size: 56px; font-weight: bold;">100%</div>
        <div style="opacity: 0.9; font-size: 16px;">All ${completedCount} habits completed!</div>
      </div>
      
      <p style="color: #374151; margin-bottom: 24px; font-size: 16px; line-height: 1.6;">
        You've completed all your habits for today! 🌟<br>
        Keep up the amazing work — consistency is the key to building lasting habits.
      </p>
      
      <a href="${appUrl}" 
         style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        View Your Progress →
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      You're receiving this because you enabled celebration emails.<br>
      <a href="${appUrl}" style="color: #6b7280;">Manage your notification preferences</a>
    </p>
  </div>
</body>
</html>
  `;
}

// ===========================================
// MAIN HANDLER
// ===========================================
export default async function handler(req, res) {
  // Verify authorization
  const authHeader = req.headers.authorization;
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isValidSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  
  if (!isVercelCron && !isValidSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const currentHour = new Date().getUTCHours();
  console.log(`[Reminder Job] Running at ${currentHour}:00 UTC`);
  
  const results = {
    timestamp: new Date().toISOString(),
    processed: 0,
    reminders_sent: 0,
    celebrations_sent: 0,
    skipped: 0,
    errors: []
  };
  
  try {
    // Get all users with reminders enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, reminder_enabled, reminder_time, reminder_threshold, celebration_enabled, timezone')
      .eq('reminder_enabled', true)
      .not('email', 'is', null);
    
    if (usersError) {
      throw usersError;
    }
    
    if (!users || users.length === 0) {
      console.log('[Reminder Job] No users with reminders enabled');
      return res.status(200).json({ success: true, message: 'No users to process', ...results });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    for (const user of users) {
      try {
        // Check if it's the right time for this user (based on their timezone)
        const userTimezone = user.timezone || 'UTC';
        let userHour;
        
        try {
          const userTime = new Date().toLocaleString('en-US', { 
            timeZone: userTimezone, 
            hour: 'numeric', 
            hour12: false 
          });
          userHour = parseInt(userTime);
        } catch (tzError) {
          // Invalid timezone, use UTC
          userHour = currentHour;
        }
        
        const reminderHour = parseInt(user.reminder_time?.split(':')[0] || '22');
        
        if (userHour !== reminderHour) {
          results.skipped++;
          continue; // Not time for this user's reminder
        }
        
        results.processed++;
        
        // Get user's completion rate for today using the helper function
        const { data: stats, error: statsError } = await supabase.rpc('get_daily_completion_rate', {
          p_user_id: user.id,
          p_date: today
        });
        
        if (statsError) {
          console.error(`[Reminder Job] Error getting stats for user ${user.id}:`, statsError);
          results.errors.push({ user_id: user.id, error: statsError.message });
          continue;
        }
        
        const completionRate = stats?.[0]?.completion_rate || 0;
        const totalHabits = stats?.[0]?.total_habits || 0;
        const completedHabits = stats?.[0]?.completed_habits || 0;
        const threshold = user.reminder_threshold || 70;
        
        // Skip if no habits
        if (totalHabits === 0) {
          results.skipped++;
          continue;
        }
        
        // Check if user completed all habits (send celebration)
        if (completionRate === 100 && user.celebration_enabled) {
          // Check if we already sent a celebration today
          const { data: alreadySent } = await supabase.rpc('email_sent_today', {
            p_user_id: user.id,
            p_email_type: 'celebration'
          });
          
          if (!alreadySent) {
            const html = generateCelebrationEmail(user.full_name, totalHabits);
            const text = `Congratulations! You completed all ${totalHabits} habits today! 🎉`;
            
            await sendEmail(user.email, '🎉 Perfect Day! All Habits Completed!', html, text);
            
            // Log the email
            await supabase.from('email_logs').insert({
              user_id: user.id,
              email_type: 'celebration',
              subject: 'Perfect Day! All Habits Completed!',
              status: 'sent',
              completion_rate: 100,
              habits_completed: totalHabits,
              habits_total: totalHabits
            });
            
            results.celebrations_sent++;
            console.log(`[Reminder Job] Celebration sent to ${user.email}`);
          }
        }
        // Check if completion is below threshold (send reminder)
        else if (completionRate < threshold) {
          // Check if we already sent a reminder today
          const { data: alreadySent } = await supabase.rpc('email_sent_today', {
            p_user_id: user.id,
            p_email_type: 'reminder'
          });
          
          if (!alreadySent) {
            // Get incomplete habits
            const { data: incompleteHabits } = await supabase.rpc('get_incomplete_habits', {
              p_user_id: user.id,
              p_date: today
            });
            
            if (incompleteHabits && incompleteHabits.length > 0) {
              const html = generateReminderEmail(
                user.full_name,
                incompleteHabits,
                completionRate,
                threshold
              );
              const text = `You have ${incompleteHabits.length} incomplete habits today. Current completion: ${completionRate}%. Target: ${threshold}%`;
              
              await sendEmail(user.email, `⏰ ${incompleteHabits.length} Habits Remaining Today`, html, text);
              
              // Log the email
              await supabase.from('email_logs').insert({
                user_id: user.id,
                email_type: 'reminder',
                subject: `${incompleteHabits.length} Habits Remaining Today`,
                status: 'sent',
                completion_rate: completionRate,
                habits_completed: completedHabits,
                habits_total: totalHabits
              });
              
              results.reminders_sent++;
              console.log(`[Reminder Job] Reminder sent to ${user.email} (${completionRate}% < ${threshold}%)`);
            }
          }
        }
      } catch (userError) {
        console.error(`[Reminder Job] Error processing user ${user.id}:`, userError);
        results.errors.push({ user_id: user.id, error: userError.message });
        
        // Log failed email attempt
        await supabase.from('email_logs').insert({
          user_id: user.id,
          email_type: 'reminder',
          status: 'failed',
          error_message: userError.message
        }).catch(() => {}); // Ignore logging errors
      }
    }
    
    console.log('[Reminder Job] Completed:', results);
    return res.status(200).json({ success: true, ...results });
    
  } catch (error) {
    console.error('[Reminder Job] Failed:', error);
    return res.status(500).json({ error: error.message, ...results });
  }
}
