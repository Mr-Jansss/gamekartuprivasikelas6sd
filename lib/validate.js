// Sanitize nickname - allow letters, numbers, spaces only
export function sanitizeNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') {
    return '';
  }
  
  // Remove dangerous characters, keep alphanumeric and spaces
  return nickname
    .trim()
    .replace(/[^\w\s]/g, '')
    .substring(0, 15);
}

// Validate nickname format
export function isValidNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') {
    return false;
  }
  
  const cleaned = nickname.trim();
  return cleaned.length >= 2 && cleaned.length <= 15;
}

// Validate session code (4 letters)
export function isValidSessionCode(code) {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  return /^[A-Z]{4}$/.test(code.toUpperCase());
}

// Validate score (0-170)
export function isValidScore(score) {
  return typeof score === 'number' && score >= 0 && score <= 170 && Number.isInteger(score);
}

// Validate correct count (0-10)
export function isValidCorrectCount(count) {
  return typeof count === 'number' && count >= 0 && count <= 10 && Number.isInteger(count);
}

// Validate best combo (0-10)
export function isValidCombo(combo) {
  return typeof combo === 'number' && combo >= 0 && combo <= 10 && Number.isInteger(combo);
}

// Validate team number (1-4)
export function isValidTeamNumber(teamNumber) {
  return typeof teamNumber === 'number' && teamNumber >= 1 && teamNumber <= 4 && Number.isInteger(teamNumber);
}

// Validate round ID
export function isValidRoundId(roundId) {
  if (!roundId || typeof roundId !== 'string') {
    return false;
  }
  
  return roundId.length >= 10 && roundId.length <= 50;
}

// Escape HTML to prevent XSS
export function escapeHtml(text) {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Get client IP address
export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         'unknown';
}
