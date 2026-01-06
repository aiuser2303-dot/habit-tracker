// Manual reminder endpoint - can be called to send a test reminder
// POST /api/send-reminder

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function sendEmail(to, subject, htmlContent, textContent) {
  if (process.env.SENDGRID_API_KEY) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.EMAIL_FROM || 'noreply@habittracker.app' },
        subject: subject,
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent }
        ]
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid error: ${error}`);
    }
    return { success: true };
  }
  
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
      to,
      subject,
      text: textContent,
      html: htmlContent
    });
    return { success: true };
  }
  
  throw new Error('No email provider configured');
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get auth token from header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (!profile?.email) {
      return res.status(400).json({ error: 'User email not found' });
    }
    
    // Send test reminder
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>🧪 Test Reminder</h1>
        <p>Hi ${profile.full_name || 'there'}!</p>
        <p>This is a test reminder email from your Habit Tracker.</p>
        <p>If you received this, your email notifications are working correctly! ✅</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Reminder threshold: ${profile.reminder_threshold || 70}%<br>
          Reminder time: ${profile.reminder_time || '22:00'}
        </p>
      </div>
    `;
    
    await sendEmail(
      profile.email,
      '🧪 Test Reminder - Habit Tracker',
      html,
      `Test reminder from Habit Tracker. Your notifications are working!`
    );
    
    // Log the test email
    await supabase.from('email_logs').insert({
      user_id: user.id,
      email_type: 'test',
      subject: 'Test Reminder',
      status: 'sent'
    });
    
    return res.status(200).json({ success: true, message: 'Test email sent!' });
    
  } catch (error) {
    console.error('Send reminder error:', error);
    return res.status(500).json({ error: error.message });
  }
}
