import { verifyAdminPassword, createAdminSession, signToken } from '../../lib/auth.js';

// POST /api/admin/login
export async function adminLogin(req, res) {
  const { password } = req.body;

  if (!verifyAdminPassword(password)) {
    return res.status(401).json({ error: 'Password salah' });
  }

  try {
    const { token, expiresAt } = await createAdminSession();
    const signature = signToken(token);

    // Set secure HTTP-only cookie
    res.cookie('admin_session', `${token}.${signature}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt
    });

    res.json({
      success: true,
      message: 'Login berhasil',
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

// POST /api/admin/logout
export async function adminLogout(req, res) {
  res.clearCookie('admin_session');
  res.json({ success: true, message: 'Logout berhasil' });
}
