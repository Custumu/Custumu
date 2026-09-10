import { supabaseAdmin } from '../services/supabase.js';

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

/**
 * Optional Auth Middleware:
 * If an Authorization header is provided, verifies user and attaches req.user.
 * If not provided, allows the request to continue as guest (req.user = null).
 */
export async function optionalAuth(req, res, next) {
  req.user = null;
  const token = extractToken(req);

  if (!token || !supabaseAdmin) {
    return next();
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data?.user) {
      req.user = data.user;
    }
  } catch (err) {
    console.warn('[Auth Middleware] Optional auth token verification failed:', err.message);
  }

  next();
}

/**
 * Required Auth Middleware:
 * Enforces a valid Supabase JWT Bearer token.
 */
export async function requireAuth(req, res, next) {
  req.user = null;

  if (!supabaseAdmin) {
    return res.status(503).json({
      error: 'Authentication service unavailable. Supabase is not configured on the server.',
    });
  }

  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Missing Authorization Bearer token',
    });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired session token',
        details: error?.message,
      });
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Auth check error:', err.message);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
}
