import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// API imports
import { getSession } from './api/session.js';
import { submitScore, scoreRateLimit } from './api/score.js';
import { getLeaderboard } from './api/leaderboard.js';
import { adminLogin, adminLogout } from './api/admin/login.js';
import { getSessions, createSession, updateSession, clearScores, requireAdmin } from './api/admin/sessions.js';
import { getScores, deleteScore } from './api/admin/scores.js';
import { exportScores } from './api/admin/export.js';
import { cleanExpiredSessions } from './lib/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || false
    : true,
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Public API endpoints
app.get('/api/session', getSession);
app.post('/api/score', scoreRateLimit, submitScore);
app.get('/api/leaderboard', getLeaderboard);

// Admin authentication endpoints
app.post('/api/admin/login', adminLogin);
app.post('/api/admin/logout', adminLogout);

// Admin session management (protected)
app.get('/api/admin/sessions', requireAdmin, getSessions);
app.post('/api/admin/sessions', requireAdmin, createSession);
app.patch('/api/admin/sessions/:id', requireAdmin, updateSession);
app.delete('/api/admin/sessions/:id/scores', requireAdmin, clearScores);

// Admin score management (protected)
app.get('/api/admin/scores/:sessionId', requireAdmin, getScores);
app.delete('/api/admin/scores/:id', requireAdmin, deleteScore);

// Admin export (protected)
app.get('/api/admin/export/:sessionId', requireAdmin, exportScores);

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'admin.html'));
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Terjadi kesalahan server',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Clean expired admin sessions every hour
setInterval(() => {
  cleanExpiredSessions().catch(console.error);
}, 60 * 60 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
  console.log(`🎮 Game: http://localhost:${PORT}`);
});
