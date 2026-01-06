// Manual reminder check endpoint (no cron needed)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
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

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    const reminderHour = parseInt(profile.reminder_time?.split(':')[0] || '22');
    const threshold = profile.reminder_threshold || 70;

    // Get user's completion rate for today
    const { data: stats } = await supabase.rpc('get_daily_completion_rate', {
      p_user_id: user.id,
      p_date: today
    });

    const completionRate = stats?.[0]?.completion_rate || 0;
    const totalHabits = stats?.[0]?.total_habits || 0;
    const completedHabits = stats?.[0]?.completed_habits || 0;

    const response = {
      user_id: user.id,
      today: today,
      current_hour: currentHour,
      reminder_hour: reminderHour,
      completion_rate: completionRate,
      completed_habits: completedHabits,
      total_habits: totalHabits,
      threshold: threshold,
      should_remind: false,
      should_celebrate: false,
      message: null
    };

    // Check if should send reminder
    if (totalHabits > 0) {
      if (completionRate === 100) {
        response.should_celebrate = true;
        response.message = `🎉 Perfect day! You completed all ${totalHabits} habits!`;
      } else if (completionRate < threshold) {
        response.should_remind = true;
        response.message = `📝 You have ${totalHabits - completedHabits} habits remaining (${completionRate}% complete)`;
      } else {
        response.message = `✅ Great progress! ${completionRate}% complete`;
      }
    } else {
      response.message = 'No active habits found';
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Check reminders error:', error);
    return res.status(500).json({ error: error.message });
  }
}