// Export user data (GDPR compliance)
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

    // Get all user data
    const [
      { data: profile },
      { data: habits },
      { data: completions },
      { data: achievements },
      { data: emailLogs }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('completions').select('*').eq('user_id', user.id),
      supabase.from('achievements').select('*').eq('user_id', user.id),
      supabase.from('email_logs').select('*').eq('user_id', user.id)
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      profile: profile,
      habits: habits || [],
      completions: completions || [],
      achievements: achievements || [],
      email_logs: emailLogs || []
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="habit-tracker-data-${user.id}.json"`);
    
    return res.status(200).json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: error.message });
  }
}