// Delete user account and all data (GDPR compliance)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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

    // Require confirmation
    const { confirm } = req.body;
    if (confirm !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({ 
        error: 'Confirmation required',
        message: 'Send { "confirm": "DELETE_MY_ACCOUNT" } to confirm deletion'
      });
    }

    // Delete all user data (cascading deletes will handle related records)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      throw deleteError;
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Account and all data deleted successfully' 
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: error.message });
  }
}