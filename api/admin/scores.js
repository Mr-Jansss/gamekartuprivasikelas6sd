import db from '../../lib/db.js';
import { requireAdmin } from '../../lib/auth.js';
import { escapeHtml } from '../../lib/validate.js';

// GET /api/admin/scores/:sessionId
export async function getScores(req, res) {
  const { sessionId } = req.params;

  try {
    // Get all scores for session
    const [scores] = await db.query(
      `SELECT 
        s.id,
        s.nickname,
        s.score,
        s.correct_count,
        s.best_combo,
        s.played_at,
        t.team_number,
        t.team_name,
        t.color
       FROM scores s
       JOIN teams t ON s.team_id = t.id
       WHERE s.session_id = ?
       ORDER BY s.score DESC, s.played_at ASC`,
      [sessionId]
    );

    // Get card statistics
    const [cardStats] = await db.query(
      `SELECT 
        card_id,
        total_attempts,
        wrong_attempts,
        ROUND((wrong_attempts / total_attempts) * 100, 1) as error_rate
       FROM card_stats
       WHERE session_id = ?
       ORDER BY error_rate DESC
       LIMIT 10`,
      [sessionId]
    );

    res.json({
      scores: scores.map(s => ({
        id: s.id,
        nickname: escapeHtml(s.nickname),
        score: s.score,
        correct: s.correct_count,
        bestCombo: s.best_combo,
        playedAt: s.played_at.toISOString(),
        teamNumber: s.team_number,
        teamName: escapeHtml(s.team_name),
        teamColor: s.color
      })),
      cardStats: cardStats.map(cs => ({
        cardId: cs.card_id,
        totalAttempts: cs.total_attempts,
        wrongAttempts: cs.wrong_attempts,
        errorRate: cs.error_rate
      }))
    });

  } catch (error) {
    console.error('Get scores error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

// DELETE /api/admin/scores/:id
export async function deleteScore(req, res) {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM scores WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Skor tidak ditemukan' });
    }

    res.json({ success: true, message: 'Skor berhasil dihapus' });

  } catch (error) {
    console.error('Delete score error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

export { requireAdmin };
