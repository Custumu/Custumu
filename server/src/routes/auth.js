import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';

const router = express.Router();

/**
 * GET /api/auth/status
 * Check if backend Supabase connection is enabled
 */
router.get('/status', (req, res) => {
  res.json({
    enabled: Boolean(supabaseAdmin),
    service: 'Supabase Authentication & PostgreSQL',
  });
});

/**
 * GET /api/auth/me
 * Protected: Fetch profile and usage limits for the authenticated user
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user profile from public.users table
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Auth Route] Error fetching profile:', error.message);
      return res.status(500).json({ error: 'Failed to retrieve user profile' });
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        metadata: req.user.user_metadata,
      },
      profile: profile || {
        id: req.user.id,
        email: req.user.email,
        tier: 'free',
        monthly_ai_tokens_used: 0,
        monthly_pages_processed: 0,
      },
    });
  } catch (err) {
    console.error('[Auth Route] Unexpected error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
