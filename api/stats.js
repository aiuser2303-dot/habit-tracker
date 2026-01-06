// Get app statistics (public endpoint)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get public stats (no personal data)
    const [
      { count: totalUsers },
      { count: totalHabits },
      { count: totalCompletions },
      { count: emailsSent }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('habits').select('*', { count: 'exact', head: true }),
      supabase.from('completions').select('*', { count: 'exact', head: true }),
      supabase.from('email_logs').select('*', { count: 'exact', head: true }).eq('status', 'sent')
    ]);

    return res.status(200).json({
      users: totalUsers || 0,
      habits: totalHabits || 0,
      completions: totalCompletions || 0,
      emails_sent: emailsSent || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Failed to get stats' });
  }
}