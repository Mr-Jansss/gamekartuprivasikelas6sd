// Admin Dashboard Script

const API_BASE = window.location.origin;

// Screens
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const projectorScreen = document.getElementById('projectorScreen');

// Login
const loginForm = document.getElementById('loginForm');
const adminPassword = document.getElementById('adminPassword');
const loginError = document.getElementById('loginError');

// Dashboard
const logoutButton = document.getElementById('logoutButton');
const createSessionForm = document.getElementById('createSessionForm');
const sessionName = document.getElementById('sessionName');
const refreshSessions = document.getElementById('refreshSessions');
const sessionsList = document.getElementById('sessionsList');

// Active Session
const activeSessionSection = document.getElementById('activeSessionSection');
const activeSessionName = document.getElementById('activeSessionName');
const leaderboardBody = document.getElementById('leaderboardBody');
const cardStatsContainer = document.getElementById('cardStatsContainer');
const exportCSV = document.getElementById('exportCSV');
const clearScores = document.getElementById('clearScores');

// View toggles
const viewIndividual = document.getElementById('viewIndividual');
const viewTeam = document.getElementById('viewTeam');
const projectorMode = document.getElementById('projectorMode');
const exitProjector = document.getElementById('exitProjector');
const projectorSessionName = document.getElementById('projectorSessionName');
const projectorContent = document.getElementById('projectorContent');

// State
let currentView = 'individual'; // 'individual' or 'team'
let activeSession = null;
let pollInterval = null;

// Initialize
function init() {
  console.log('🚀 Admin dashboard initializing...');
  
  loginForm.addEventListener('submit', handleLogin);
  logoutButton.addEventListener('click', handleLogout);
  createSessionForm.addEventListener('submit', handleCreateSession);
  refreshSessions.addEventListener('click', loadSessions);
  
  viewIndividual.addEventListener('click', () => switchView('individual'));
  viewTeam.addEventListener('click', () => switchView('team'));
  projectorMode.addEventListener('click', enterProjectorMode);
  exitProjector.addEventListener('click', exitProjectorMode);
  
  exportCSV.addEventListener('click', handleExport);
  clearScores.addEventListener('click', handleClearScores);
  
  // Event delegation for dynamically created buttons
  sessionsList.addEventListener('click', handleSessionClick);
  
  console.log('✅ Event listeners attached');
}

// Handle clicks on session buttons (event delegation)
function handleSessionClick(e) {
  const target = e.target.closest('button');
  if (!target) return;

  console.log('Button clicked:', target.className);

  // View session button
  if (target.classList.contains('view-session-btn')) {
    const id = parseInt(target.dataset.id);
    const code = target.dataset.code;
    const name = target.dataset.name;
    console.log('View session:', id, code, name);
    window.viewSession(id, code, name);
  }

  // Toggle session button
  if (target.classList.contains('toggle-session-btn')) {
    const id = parseInt(target.dataset.id);
    const status = target.dataset.status;
    console.log('Toggle session:', id, status);
    window.toggleSession(id, status);
  }
}

// Login
async function handleLogin(e) {
  e.preventDefault();
  loginError.textContent = '';

  try {
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password: adminPassword.value })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login gagal');
    }

    showScreen(dashboardScreen);
    loadSessions();
  } catch (error) {
    loginError.textContent = '❌ ' + error.message;
    adminPassword.value = '';
  }
}

async function handleLogout() {
  try {
    await fetch(`${API_BASE}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  stopPolling();
  activeSession = null;
  activeSessionSection.style.display = 'none';
  showScreen(loginScreen);
  adminPassword.value = '';
}

// Create Session
async function handleCreateSession(e) {
  e.preventDefault();

  const name = sessionName.value.trim();
  if (!name) return;

  try {
    const response = await fetch(`${API_BASE}/api/admin/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Gagal membuat sesi');
    }

    const data = await response.json();
    
    alert(`✅ Sesi berhasil dibuat!\n\nKode: ${data.session.code}\n\nBagikan kode ini ke siswa.`);
    
    sessionName.value = '';
    loadSessions();

  } catch (error) {
    alert('❌ ' + error.message);
  }
}

// Load Sessions
async function loadSessions() {
  console.log('📋 Loading sessions...');
  sessionsList.innerHTML = '<p class="loading">Memuat...</p>';

  try {
    const response = await fetch(`${API_BASE}/api/admin/sessions`, {
      credentials: 'include'
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error('Gagal memuat sesi');
    }

    const data = await response.json();
    console.log('Sessions data:', data);
    displaySessions(data.sessions);

  } catch (error) {
    console.error('Load sessions error:', error);
    sessionsList.innerHTML = `<p class="error-message">❌ ${error.message}</p>`;
  }
}

function displaySessions(sessions) {
  console.log('📊 Displaying', sessions.length, 'sessions');
  
  if (sessions.length === 0) {
    sessionsList.innerHTML = '<p class="loading">Belum ada sesi. Buat sesi baru!</p>';
    return;
  }

  sessionsList.innerHTML = '';

  sessions.forEach(session => {
    const card = document.createElement('div');
    card.className = 'session-card';

    const statusClass = session.status === 'open' ? 'open' : 'closed';
    const statusText = session.status === 'open' ? '🟢 Terbuka' : '🔴 Ditutup';
    const toggleText = session.status === 'open' ? 'Tutup' : 'Buka';
    const toggleStatus = session.status === 'open' ? 'closed' : 'open';
    const toggleClass = session.status === 'open' ? 'btn-danger' : 'btn-success';

    card.innerHTML = `
      <div class="session-info">
        <div class="session-code">${session.code}</div>
        <div class="session-name">${escapeHtml(session.name)}</div>
        <div class="session-meta">
          <span class="session-status ${statusClass}">${statusText}</span>
          <span>👥 ${session.total_players} pemain</span>
          <span>🏆 Skor tertinggi: ${session.highest_score}</span>
        </div>
      </div>
      <div class="session-actions-buttons">
        <button 
          class="btn btn-primary btn-small view-session-btn" 
          data-id="${session.id}"
          data-code="${session.code}"
          data-name="${escapeHtml(session.name)}">
          📊 Lihat
        </button>
        <button 
          class="btn ${toggleClass} btn-small toggle-session-btn"
          data-id="${session.id}"
          data-status="${toggleStatus}">
          ${toggleText}
        </button>
      </div>
    `;

    sessionsList.appendChild(card);
  });

  console.log('✅ Sessions displayed, attaching listeners...');
  
  // Attach click listeners to all buttons
  document.querySelectorAll('.view-session-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = parseInt(this.dataset.id);
      const code = this.dataset.code;
      const name = this.dataset.name;
      console.log('View clicked:', id, code, name);
      window.viewSession(id, code, name);
    });
  });

  document.querySelectorAll('.toggle-session-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = parseInt(this.dataset.id);
      const status = this.dataset.status;
      console.log('Toggle clicked:', id, status);
      window.toggleSession(id, status);
    });
  });

  console.log('✅ Button listeners attached');
}

// View Session
window.viewSession = function(sessionId, code, name) {
  console.log('👁️ Viewing session:', sessionId, code, name);
  
  activeSession = { id: sessionId, code, name };
  activeSessionName.textContent = `${code} - ${name}`;
  activeSessionSection.style.display = 'block';
  activeSessionSection.scrollIntoView({ behavior: 'smooth' });
  
  console.log('📊 Loading scores for session...');
  loadScores();
  startPolling();
};

// Toggle Session Status
window.toggleSession = async function(sessionId, newStatus) {
  console.log('🔄 Toggling session:', sessionId, 'to', newStatus);
  
  const confirmMsg = newStatus === 'closed' 
    ? 'Tutup sesi ini? Siswa tidak bisa kirim skor lagi.' 
    : 'Buka kembali sesi ini?';

  if (!confirm(confirmMsg)) {
    console.log('❌ User cancelled');
    return;
  }

  try {
    console.log('📤 Sending PATCH request...');
    const response = await fetch(`${API_BASE}/api/admin/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: newStatus })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Gagal mengubah status');
    }

    console.log('✅ Session status updated');
    loadSessions();
    if (activeSession && activeSession.id === sessionId) {
      loadScores();
    }

  } catch (error) {
    console.error('Toggle session error:', error);
    alert('❌ ' + error.message);
  }
};

// Load Scores
async function loadScores() {
  if (!activeSession) {
    console.warn('⚠️ No active session');
    return;
  }

  console.log('📊 Loading scores for session:', activeSession.id);

  try {
    const [scoresResponse, leaderboardResponse] = await Promise.all([
      fetch(`${API_BASE}/api/admin/scores/${activeSession.id}`, { credentials: 'include' }),
      fetch(`${API_BASE}/api/leaderboard?code=${activeSession.code}&type=${currentView}`)
    ]);

    console.log('Scores response:', scoresResponse.status);
    console.log('Leaderboard response:', leaderboardResponse.status);

    if (!scoresResponse.ok || !leaderboardResponse.ok) {
      throw new Error('Gagal memuat data');
    }

    const scoresData = await scoresResponse.json();
    const leaderboardData = await leaderboardResponse.json();

    console.log('Scores data:', scoresData);
    console.log('Leaderboard data:', leaderboardData);

    if (currentView === 'individual') {
      displayIndividualLeaderboard(leaderboardData.leaderboard, scoresData.scores);
    } else {
      displayTeamLeaderboard(leaderboardData.leaderboard);
    }

    displayCardStats(scoresData.cardStats);

    console.log('✅ Scores displayed');

  } catch (error) {
    console.error('Load scores error:', error);
    leaderboardBody.innerHTML = `<tr><td colspan="7">❌ ${error.message}</td></tr>`;
  }
}

function displayIndividualLeaderboard(leaderboard, allScores) {
  if (leaderboard.length === 0) {
    leaderboardBody.innerHTML = '<tr><td colspan="7">Belum ada data</td></tr>';
    return;
  }

  leaderboardBody.innerHTML = '';

  leaderboard.forEach((entry, index) => {
    const rank = index + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    const scoreEntry = allScores.find(s => 
      s.nickname === entry.nickname && s.score === entry.score
    );

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="rank ${rankClass}">#${rank}</span></td>
      <td><strong>${entry.nickname}</strong></td>
      <td><span class="team-badge" style="background-color: ${entry.teamColor}">${entry.teamName}</span></td>
      <td><span class="score-value">${entry.score}</span></td>
      <td>${entry.correct}/10</td>
      <td>${entry.bestCombo}</td>
      <td>
        ${scoreEntry ? `<button class="btn btn-danger btn-small" onclick="deleteScore(${scoreEntry.id})">Hapus</button>` : ''}
      </td>
    `;

    leaderboardBody.appendChild(row);
  });
}

function displayTeamLeaderboard(teams) {
  const tableContainer = document.getElementById('leaderboardContainer');
  
  if (teams.length === 0) {
    tableContainer.innerHTML = '<p class="loading">Belum ada data</p>';
    return;
  }

  let html = '<div class="team-leaderboard">';
  
  teams.forEach((team, index) => {
    const rank = index + 1;
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    
    html += `
      <div class="team-card-large" style="border: 4px solid ${team.color}">
        <div class="team-card-rank">${rankEmoji}</div>
        <div class="team-card-name" style="color: ${team.color}">${team.teamName}</div>
        <div class="team-card-score">${team.totalScore}</div>
        <div class="team-card-meta">
          ${team.playerCount} pemain · Rata-rata: ${team.avgScore}
        </div>
      </div>
    `;
  });

  html += '</div>';
  tableContainer.innerHTML = html;
}

function displayCardStats(stats) {
  if (!stats || stats.length === 0) {
    cardStatsContainer.innerHTML = '<p class="loading">Belum ada data statistik</p>';
    return;
  }

  const CARD_NAMES = {
    'alamat_rumah': 'Alamat Rumah',
    'password': 'Password Akun',
    'nomor_hp': 'Nomor HP',
    'foto_seragam': 'Foto Seragam Sekolah',
    'kode_otp': 'Kode OTP',
    'lokasi_live': 'Lokasi Live',
    'nama_tanggal_lahir': 'Nama + Tanggal Lahir',
    'nomor_hp_ortu': 'Nomor HP Orang Tua',
    'foto_kartu_keluarga': 'Foto Kartu Keluarga',
    'jadwal_sekolah': 'Jadwal Sekolah'
  };

  cardStatsContainer.innerHTML = '';

  stats.forEach(stat => {
    const cardName = CARD_NAMES[stat.cardId] || stat.cardId;
    
    const bar = document.createElement('div');
    bar.className = 'card-stat-bar';
    bar.innerHTML = `
      <div class="card-stat-info">${cardName}</div>
      <div class="card-stat-bar-container">
        <div class="card-stat-bar-fill" style="width: ${stat.errorRate}%">
          ${stat.errorRate}% salah
        </div>
      </div>
    `;

    cardStatsContainer.appendChild(bar);
  });
}

// Delete Score
window.deleteScore = async function(scoreId) {
  if (!confirm('Hapus skor ini?')) return;

  try {
    const response = await fetch(`${API_BASE}/api/admin/scores/${scoreId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Gagal menghapus skor');
    }

    loadScores();

  } catch (error) {
    alert('❌ ' + error.message);
  }
};

// View Switching
function switchView(view) {
  currentView = view;
  
  viewIndividual.classList.toggle('active-view', view === 'individual');
  viewTeam.classList.toggle('active-view', view === 'team');
  
  // Reset table
  const tableContainer = document.getElementById('leaderboardContainer');
  if (view === 'individual') {
    tableContainer.innerHTML = `
      <table class="leaderboard-table" id="leaderboardTable">
        <thead>
          <tr>
            <th>Peringkat</th>
            <th>Nama</th>
            <th>Tim</th>
            <th>Skor</th>
            <th>Benar</th>
            <th>Combo</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody id="leaderboardBody">
          <tr><td colspan="7">Memuat...</td></tr>
        </tbody>
      </table>
    `;
  }
  
  loadScores();
}

// Projector Mode
function enterProjectorMode() {
  if (!activeSession) return;
  
  projectorSessionName.textContent = `${activeSession.code} - ${activeSession.name}`;
  showScreen(projectorScreen);
  updateProjector();
  
  // Update every 3 seconds
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(updateProjector, 3000);
}

function exitProjectorMode() {
  showScreen(dashboardScreen);
  stopPolling();
  startPolling();
}

async function updateProjector() {
  if (!activeSession) return;

  try {
    const response = await fetch(
      `${API_BASE}/api/leaderboard?code=${activeSession.code}&type=${currentView}`
    );

    if (!response.ok) return;

    const data = await response.json();

    if (currentView === 'individual') {
      displayProjectorIndividual(data.leaderboard);
    } else {
      displayProjectorTeam(data.leaderboard);
    }

  } catch (error) {
    console.error('Update projector error:', error);
  }
}

function displayProjectorIndividual(leaderboard) {
  if (leaderboard.length === 0) {
    projectorContent.innerHTML = '<p style="text-align:center;font-size:2rem">Belum ada data</p>';
    return;
  }

  let html = '';

  // Top 3 podium
  if (leaderboard.length >= 3) {
    html += '<div class="projector-podium">';
    [1, 0, 2].forEach(index => {
      if (leaderboard[index]) {
        const entry = leaderboard[index];
        const place = index === 0 ? 'first' : index === 1 ? 'second' : 'third';
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        
        html += `
          <div class="podium-place ${place}">
            <div class="podium-rank">${rankEmoji}</div>
            <div class="podium-name">${escapeHtml(entry.nickname)}</div>
            <div class="podium-score">${entry.score}</div>
            <div class="podium-base"></div>
          </div>
        `;
      }
    });
    html += '</div>';
  }

  // Rest of leaderboard
  if (leaderboard.length > 3) {
    html += '<div class="projector-list">';
    leaderboard.slice(3, 10).forEach((entry, index) => {
      html += `
        <div class="projector-item">
          <div class="projector-rank">#${index + 4}</div>
          <div class="projector-name">${escapeHtml(entry.nickname)}</div>
          <div class="projector-score">${entry.score}</div>
        </div>
      `;
    });
    html += '</div>';
  }

  projectorContent.innerHTML = html;
}

function displayProjectorTeam(teams) {
  if (teams.length === 0) {
    projectorContent.innerHTML = '<p style="text-align:center;font-size:2rem">Belum ada data</p>';
    return;
  }

  let html = '<div class="team-leaderboard">';
  
  teams.forEach((team, index) => {
    const rank = index + 1;
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank === 4 ? '4️⃣' : `#${rank}`;
    
    html += `
      <div class="team-card-large" style="border: 6px solid ${team.color}">
        <div class="team-card-rank" style="font-size: 3rem">${rankEmoji}</div>
        <div class="team-card-name" style="color: ${team.color}">${team.teamName}</div>
        <div class="team-card-score">${team.totalScore}</div>
        <div class="team-card-meta">
          ${team.playerCount} pemain · Rata-rata: ${team.avgScore}
        </div>
      </div>
    `;
  });

  html += '</div>';
  projectorContent.innerHTML = html;
}

// Export CSV
async function handleExport() {
  if (!activeSession) return;

  try {
    const response = await fetch(`${API_BASE}/api/admin/export/${activeSession.id}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Gagal mengekspor data');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skor-${activeSession.code}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (error) {
    alert('❌ ' + error.message);
  }
}

// Clear Scores
async function handleClearScores() {
  if (!activeSession) return;

  if (!confirm('⚠️ PERHATIAN!\n\nHapus SEMUA skor sesi ini?\n\nTidak bisa dibatalkan!')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/admin/sessions/${activeSession.id}/scores`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Gagal menghapus skor');
    }

    alert('✅ Semua skor berhasil dihapus');
    loadScores();

  } catch (error) {
    alert('❌ ' + error.message);
  }
}

// Polling
function startPolling() {
  stopPolling();
  pollInterval = setInterval(loadScores, 3000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// Screen Management
function showScreen(screen) {
  [loginScreen, dashboardScreen, projectorScreen].forEach(s => {
    s.classList.remove('active');
  });
  screen.classList.add('active');
}

// Utility
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
init();
