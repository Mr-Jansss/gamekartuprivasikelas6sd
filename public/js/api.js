// API client untuk komunikasi dengan backend

const API_BASE = window.location.origin;

// Get session info
export async function getSession(code) {
  const response = await fetch(`${API_BASE}/api/session?code=${encodeURIComponent(code)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gagal mengambil data sesi');
  }
  return response.json();
}

// Submit score
export async function submitScore(data) {
  const response = await fetch(`${API_BASE}/api/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gagal mengirim skor');
  }

  return response.json();
}

// Get leaderboard
export async function getLeaderboard(code, type = 'individual') {
  const response = await fetch(
    `${API_BASE}/api/leaderboard?code=${encodeURIComponent(code)}&type=${type}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gagal mengambil papan skor');
  }
  
  return response.json();
}

// Offline score storage
const OFFLINE_KEY = 'offline_scores';

export function saveOfflineScore(scoreData) {
  try {
    const offline = JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
    offline.push({
      ...scoreData,
      savedAt: new Date().toISOString()
    });
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(offline));
    return true;
  } catch (error) {
    console.error('Failed to save offline:', error);
    return false;
  }
}

export function getOfflineScores() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

export function clearOfflineScore(index) {
  try {
    const offline = getOfflineScores();
    offline.splice(index, 1);
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(offline));
    return true;
  } catch (error) {
    return false;
  }
}

// Retry offline scores with exponential backoff
export async function retryOfflineScores() {
  const offline = getOfflineScores();
  const results = [];

  for (let i = 0; i < offline.length; i++) {
    const scoreData = offline[i];
    
    try {
      await submitScore(scoreData);
      clearOfflineScore(i);
      results.push({ success: true, index: i });
    } catch (error) {
      results.push({ success: false, index: i, error: error.message });
    }
  }

  return results;
}
