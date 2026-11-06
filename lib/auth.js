import crypto from 'crypto';
import db from './db.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!ADMIN_SECRET || ADMIN_SECRET.length < 32) {
  console.warn('⚠️  ADMIN_SECRET should be at least 32 characters for security');
}

// Generate session token
export function generateSessionToken() {
  return crypto.randomBytes(64).toString('hex');
}

// Create HMAC signature for cookie
export function signToken(token) {
  return crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(token)
    .digest('hex');
}

// Verify HMAC signature (timing-safe comparison)
export function verifyToken(token, signature) {
  const expected = signToken(token);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

// Verify admin password (timing-safe comparison)
export function verifyAdminPassword(inputPassword) {
  if (!ADMIN_PASSWORD || !inputPassword) {
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(ADMIN_PASSWORD),
      Buffer.from(inputPassword)
    );
  } catch {
    return false;
  }
}

// Create admin session in database
export async function createAdminSession() {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + parseInt(process.env.SESSION_DURATION_HOURS || 8));

  await db.query(
    'INSERT INTO admin_sessions (session_token, expires_at) VALUES (?, ?)',
    [token, expiresAt]
  );

  return { token, expiresAt };
}

// Verify admin session from database
export async function verifyAdminSession(token) {
  const [rows] = await db.query(
    'SELECT * FROM admin_sessions WHERE session_token = ? AND expires_at > NOW()',
    [token]
  );

  return rows.length > 0;
}

// Clean expired sessions
export async function cleanExpiredSessions() {
  await db.query('DELETE FROM admin_sessions WHERE expires_at <= NOW()');
}

// Middleware to check admin authentication
export async function requireAdmin(req, res, next) {
  const authCookie = req.headers.cookie
    ?.split(';')
    .find(c => c.trim().startsWith('admin_session='));

  if (!authCookie) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  const [token, signature] = authCookie.split('=')[1].split('.');
  
  if (!token || !signature || !verifyToken(token, signature)) {
    return res.status(401).json({ error: 'Sesi tidak valid' });
  }

  const isValid = await verifyAdminSession(token);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Sesi sudah kadaluarsa' });
  }

  req.adminToken = token;
  next();
}
