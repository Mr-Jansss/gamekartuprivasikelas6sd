import db from '../lib/db.js';
import { rateLimitMiddleware } from '../lib/ratelimit.js';
import {
  sanitizeNickname,
  isValidNickname,
  isValidScore,
  isValidCorrectCount,
  isValidCombo,
  isValidRoundId,
  getClientIp
} from '../lib/validate.js';

// POST /api/score
export const scoreRateLimit = rateLimitMiddleware('score');

export async function submitScore(req, res) {
  const { code, teamId, nickname, score, correct, bestCombo, roundId, answers } = req.body;

  // Validate inputs
  const cleanNickname = sanitizeNickname(nickname);
  
  if (!isValidNickname(cleanNickname)) {
    return res.status(400).json({ error: 'Nama panggilan harus 2-15 karakter' });
  }

  if (!isValidScore(score)) {
    return res.status(400).json({ error: 'Skor tidak valid (0-170)' });
  }

  if (!isValidCorrectCount(correct)) {
    return res.status(400).json({ error: 'Jumlah benar tidak valid (0-10)' });
  }

  if (!isValidCombo(bestCombo)) {
    return res.status(400).json({ error: 'Combo tidak valid (0-10)' });
  }

  if (!isValidRoundId(roundId)) {
    return res.status(400).json({ error: 'Round ID tidak valid' });
  }

  if (!Array.isArray(answers) || answers.length !== 10) {
    return res.status(400).json({ error: 'Data jawaban tidak valid' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Verify session exists and is open
    const [sessions] = await connection.query(
      'SELECT id, status FROM sessions WHERE code = ?',
      [code?.toUpperCase()]
    );

    if (sessions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Kode sesi tidak ditemukan' });
    }

    const session = sessions[0];

    if (session.status !== 'open') {
      await connection.rollback();
      return res.status(403).json({ error: 'Sesi sudah ditutup' });
    }

    // Verify team belongs to session
    const [teams] = await connection.query(
      'SELECT id FROM teams WHERE id = ? AND session_id = ?',
      [teamId, session.id]
    );

    if (teams.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Tim tidak valid' });
    }

    // Check for duplicate round (prevent double submission)
    const [existing] = await connection.query(
      'SELECT id FROM scores WHERE session_id = ? AND nickname = ? AND round_id = ?',
      [session.id, cleanNickname, roundId]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Skor sudah dikirim sebelumnya' });
    }

    const ip = getClientIp(req);

    // Insert score
    await connection.query(
      `INSERT INTO scores (session_id, team_id, nickname, score, correct_count, best_combo, round_id, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [session.id, teamId, cleanNickname, score, correct, bestCombo, roundId, ip]
    );

    // Update card statistics
    for (const answer of answers) {
      if (!answer.id || typeof answer.correct !== 'boolean') continue;

      await connection.query(
        `INSERT INTO card_stats (session_id, card_id, total_attempts, wrong_attempts)
         VALUES (?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
         total_attempts = total_attempts + 1,
         wrong_attempts = wrong_attempts + ?`,
        [session.id, answer.id, answer.correct ? 0 : 1, answer.correct ? 0 : 1]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Skor berhasil disimpan'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Submit score error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  } finally {
    connection.release();
  }
}
