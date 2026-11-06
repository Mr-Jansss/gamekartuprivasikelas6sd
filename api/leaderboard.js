import db from '../lib/db.js';
import { escapeHtml } from '../lib/validate.js';

const TITLES = {
  thresholds: [
    { min: 90, title: 'Agen Rahasia Super' },
    { min: 50, title: 'Penjaga Data' },
    { min: 0, title: 'Pemula Waspada' }
  ]
};

function getTitle(score) {
  for (const { min, title } of TITLES.thresholds) {
    if (score >= min) return title;
  }
  return 'Pemula Waspada';
}

// GET /api/leaderboard?code=XXXX&type=individual|team
export async function getLeaderboard(req, res) {
  const { code, type = 'individual' } = req.query;

  try {
    const [sessions] = await db.query(
      'SELECT id FROM sessions WHERE code = ?',
      [code?.toUpperCase()]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Kode sesi tidak ditemukan' });
    }

    const sessionId = sessions[0].id;

    if (type === 'team') {
      // Team leaderboard: sum of all players per team
      const [teamScores] = await db.query(
        `SELECT 
          t.id,
          t.team_number,
          t.team_name,
          t.color,
          COUNT(s.id) as player_count,
          COALESCE(SUM(s.score), 0) as total_score,
          COALESCE(AVG(s.score), 0) as avg_score
         FROM teams t
         LEFT JOIN scores s ON s.team_id = t.id
         WHERE t.session_id = ?
         GROUP BY t.id, t.team_number, t.team_name, t.color
         ORDER BY total_score DESC`,
        [sessionId]
      );

      res.json({
        type: 'team',
        leaderboard: teamScores.map(team => ({
          teamId: team.id,
          teamNumber: team.team_number,
          teamName: escapeHtml(team.team_name),
          color: team.color,
          playerCount: team.player_count,
          totalScore: team.total_score,
          avgScore: Math.round(team.avg_score)
        }))
      });

    } else {
      // Individual leaderboard: top 10 highest scores
      const [scores] = await db.query(
        `SELECT 
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
         ORDER BY s.score DESC, s.played_at ASC
         LIMIT 10`,
        [sessionId]
      );

      res.json({
        type: 'individual',
        leaderboard: scores.map(entry => ({
          nickname: escapeHtml(entry.nickname),
          score: entry.score,
          correct: entry.correct_count,
          bestCombo: entry.best_combo,
          title: getTitle(entry.score),
          teamNumber: entry.team_number,
          teamName: escapeHtml(entry.team_name),
          teamColor: entry.color,
          playedAt: entry.played_at.toISOString()
        }))
      });
    }

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}
