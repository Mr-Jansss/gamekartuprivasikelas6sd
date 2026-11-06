import db from '../../lib/db.js';
import { requireAdmin } from '../../lib/auth.js';

// GET /api/admin/export/:sessionId
export async function exportScores(req, res) {
  const { sessionId } = req.params;

  try {
    const [scores] = await db.query(
      `SELECT 
        s.nickname as 'Nama Panggilan',
        t.team_name as 'Tim',
        s.score as 'Skor',
        s.correct_count as 'Jumlah Benar',
        s.best_combo as 'Combo Terbaik',
        DATE_FORMAT(s.played_at, '%Y-%m-%d %H:%i:%s') as 'Waktu Main'
       FROM scores s
       JOIN teams t ON s.team_id = t.id
       WHERE s.session_id = ?
       ORDER BY s.score DESC`,
      [sessionId]
    );

    if (scores.length === 0) {
      return res.status(404).json({ error: 'Tidak ada data untuk diekspor' });
    }

    // Generate CSV
    const headers = Object.keys(scores[0]);
    const csvRows = [
      headers.join(','),
      ...scores.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(',')
      )
    ];

    const csv = csvRows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=skor-session-${sessionId}.csv`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 support

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

export { requireAdmin };
