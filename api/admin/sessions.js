import db from '../../lib/db.js';
import { requireAdmin } from '../../lib/auth.js';

// Generate random 4-letter code
function generateCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}

const TEAM_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
const TEAM_NAMES = ['Tim Merah', 'Tim Biru', 'Tim Hijau', 'Tim Oranye'];

// GET /api/admin/sessions
export async function getSessions(req, res) {
  try {
    const [sessions] = await db.query(
      `SELECT 
        s.id,
        s.code,
        s.name,
        s.status,
        s.created_at,
        COUNT(DISTINCT sc.id) as total_players,
        COUNT(DISTINCT sc.team_id) as active_teams,
        COALESCE(MAX(sc.score), 0) as highest_score
       FROM sessions s
       LEFT JOIN scores sc ON s.id = sc.session_id
       GROUP BY s.id
       ORDER BY s.created_at DESC
       LIMIT 50`
    );

    res.json({ sessions });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

// POST /api/admin/sessions
export async function createSession(req, res) {
  const { name } = req.body;

  if (!name || name.trim().length < 3) {
    return res.status(400).json({ error: 'Nama sesi harus minimal 3 karakter' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Generate unique code
    let code;
    let attempts = 0;
    do {
      code = generateCode();
      const [existing] = await connection.query(
        'SELECT id FROM sessions WHERE code = ?',
        [code]
      );
      if (existing.length === 0) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new Error('Gagal generate kode unik');
    }

    // Create session
    const [result] = await connection.query(
      'INSERT INTO sessions (code, name, status) VALUES (?, ?, ?)',
      [code, name.trim(), 'open']
    );

    const sessionId = result.insertId;

    // Create 4 teams
    for (let i = 0; i < 4; i++) {
      await connection.query(
        'INSERT INTO teams (session_id, team_number, team_name, color) VALUES (?, ?, ?, ?)',
        [sessionId, i + 1, TEAM_NAMES[i], TEAM_COLORS[i]]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      session: {
        id: sessionId,
        code,
        name: name.trim()
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  } finally {
    connection.release();
  }
}

// PATCH /api/admin/sessions/:id
export async function updateSession(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!['open', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid' });
  }

  try {
    const [result] = await db.query(
      'UPDATE sessions SET status = ?, closed_at = IF(? = "closed", NOW(), NULL) WHERE id = ?',
      [status, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    }

    res.json({ success: true, message: `Sesi ${status === 'open' ? 'dibuka' : 'ditutup'}` });

  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

// DELETE /api/admin/sessions/:id/scores
export async function clearScores(req, res) {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM scores WHERE session_id = ?', [id]);
    await db.query('DELETE FROM card_stats WHERE session_id = ?', [id]);

    res.json({ success: true, message: 'Skor berhasil direset' });

  } catch (error) {
    console.error('Clear scores error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

export { requireAdmin };
