import db from '../lib/db.js';
import { isValidSessionCode } from '../lib/validate.js';

// GET /api/session?code=XXXX
export async function getSession(req, res) {
  const { code } = req.query;

  if (!isValidSessionCode(code)) {
    return res.status(400).json({ error: 'Kode sesi tidak valid' });
  }

  try {
    const [sessions] = await db.query(
      'SELECT id, code, name, status FROM sessions WHERE code = ?',
      [code.toUpperCase()]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Kode sesi tidak ditemukan' });
    }

    const session = sessions[0];

    if (session.status !== 'open') {
      return res.status(403).json({ error: 'Sesi sudah ditutup' });
    }

    // Get teams for this session
    const [teams] = await db.query(
      'SELECT id, team_number, team_name, color FROM teams WHERE session_id = ? ORDER BY team_number',
      [session.id]
    );

    res.json({
      session: {
        id: session.id,
        code: session.code,
        name: session.name
      },
      teams
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}
