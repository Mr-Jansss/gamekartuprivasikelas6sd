import db from './db.js';
import { getClientIp } from './validate.js';

const RATE_LIMIT_WINDOW = 60; // seconds
const MAX_REQUESTS = 20;

export async function checkRateLimit(req, endpoint) {
  const ip = getClientIp(req);
  const now = new Date();

  try {
    // Clean old entries
    await db.query(
      'DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL ? SECOND)',
      [RATE_LIMIT_WINDOW]
    );

    // Get or create rate limit entry
    const [rows] = await db.query(
      'SELECT request_count, window_start FROM rate_limits WHERE ip_address = ? AND endpoint = ?',
      [ip, endpoint]
    );

    if (rows.length === 0) {
      // First request in window
      await db.query(
        'INSERT INTO rate_limits (ip_address, endpoint, request_count) VALUES (?, ?, 1)',
        [ip, endpoint]
      );
      return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    const { request_count, window_start } = rows[0];
    const windowAge = (now - new Date(window_start)) / 1000;

    if (windowAge > RATE_LIMIT_WINDOW) {
      // Reset window
      await db.query(
        'UPDATE rate_limits SET request_count = 1, window_start = NOW() WHERE ip_address = ? AND endpoint = ?',
        [ip, endpoint]
      );
      return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    if (request_count >= MAX_REQUESTS) {
      const retryAfter = Math.ceil(RATE_LIMIT_WINDOW - windowAge);
      return { allowed: false, retryAfter };
    }

    // Increment counter
    await db.query(
      'UPDATE rate_limits SET request_count = request_count + 1 WHERE ip_address = ? AND endpoint = ?',
      [ip, endpoint]
    );

    return { allowed: true, remaining: MAX_REQUESTS - request_count - 1 };

  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow request on error to not block users
    return { allowed: true, remaining: MAX_REQUESTS };
  }
}

export function rateLimitMiddleware(endpoint) {
  return async (req, res, next) => {
    const result = await checkRateLimit(req, endpoint);

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Terlalu banyak permintaan',
        retryAfter: result.retryAfter
      });
    }

    res.setHeader('X-RateLimit-Remaining', result.remaining);
    next();
  };
}
