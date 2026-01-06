// Health check endpoint
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const checks = {
      supabase: !!process.env.VITE_SUPABASE_URL,
      email: !!(process.env.SENDGRID_API_KEY || process.env.SMTP_HOST),
      cron_secret: !!process.env.CRON_SECRET
    };

    const allHealthy = Object.values(checks).every(Boolean);

    return res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      version: '1.0.0'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}