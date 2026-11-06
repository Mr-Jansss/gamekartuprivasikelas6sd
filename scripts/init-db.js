import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbSchema = `
-- Create database
CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ${process.env.DB_NAME};

-- Sessions table (game sessions created by admin)
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(4) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  status ENUM('open', 'closed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  INDEX idx_code (code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teams table (4 kelompok per session)
CREATE TABLE IF NOT EXISTS teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  team_number INT NOT NULL CHECK (team_number BETWEEN 1 AND 4),
  team_name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team (session_id, team_number),
  INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scores table (individual player scores within teams)
CREATE TABLE IF NOT EXISTS scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  team_id INT NOT NULL,
  nickname VARCHAR(15) NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 170),
  correct_count INT NOT NULL,
  best_combo INT NOT NULL DEFAULT 0,
  round_id VARCHAR(50) NOT NULL,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_round (session_id, nickname, round_id),
  INDEX idx_session (session_id),
  INDEX idx_team (team_id),
  INDEX idx_score (score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Answer statistics (per card tracking)
CREATE TABLE IF NOT EXISTS card_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  card_id VARCHAR(50) NOT NULL,
  total_attempts INT DEFAULT 0,
  wrong_attempts INT DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_card_stat (session_id, card_id),
  INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_token VARCHAR(128) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_token (session_token),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_limit (ip_address, endpoint),
  INDEX idx_ip (ip_address),
  INDEX idx_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    
    // Connect without database first to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL');
    console.log('📋 Creating database and tables...');

    // Execute schema
    await connection.query(dbSchema);

    console.log('✅ Database initialized successfully!');
    console.log(`📊 Database name: ${process.env.DB_NAME}`);
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
