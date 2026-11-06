import { Game } from './game.js';
import { GAME_CONFIG } from './cards.js';
import { sound } from './sound.js';
import { getSession, getOfflineScores, getLeaderboard } from './api.js';

// DOM Elements
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const resultsScreen = document.getElementById('resultsScreen');
const soundToggle = document.getElementById('soundToggle');

// Start screen elements
const sessionCodeInput = document.getElementById('sessionCode');
const nicknameInput = document.getElementById('nickname');
const startForm = document.getElementById('startForm');
const teamSelection = document.getElementById('teamSelection');
const nicknameGroup = document.getElementById('nicknameGroup');
const teamButtons = document.getElementById('teamButtons');
const startButton = document.getElementById('startButton');

// Game screen elements
const scoreDisplay = document.getElementById('scoreDisplay');
const correctDisplay = document.getElementById('correctDisplay');
const comboDisplay = document.getElementById('comboDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const cardNumber = document.getElementById('cardNumber');
const timerBar = document.getElementById('timerBar');
const cardIcon = document.getElementById('cardIcon');
const cardText = document.getElementById('cardText');
const cardDisplay = document.getElementById('cardDisplay');
const bolehButton = document.getElementById('bolehButton');
const janganButton = document.getElementById('janganButton');
const explanationOverlay = document.getElementById('explanationOverlay');
const explanationTitle = document.getElementById('explanationTitle');
const explanationText = document.getElementById('explanationText');
const explanationMascot = document.getElementById('explanationMascot');
const continueButton = document.getElementById('continueButton');

// Results screen elements
const resultsMascot = document.getElementById('resultsMascot');
const resultsTitle = document.getElementById('resultsTitle');
const titleEmoji = document.getElementById('titleEmoji');
const titleText = document.getElementById('titleText');
const finalScore = document.getElementById('finalScore');
const finalCorrect = document.getElementById('finalCorrect');
const finalCombo = document.getElementById('finalCombo');
const saveStatus = document.getElementById('saveStatus');
const playAgainButton = document.getElementById('playAgainButton');
const viewLeaderboardButton = document.getElementById('viewLeaderboardButton');

// Leaderboard modal
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboard = document.getElementById('closeLeaderboard');
const leaderboardContent = document.getElementById('leaderboardContent');

// Offline
const offlineScoresNotice = document.getElementById('offlineScores');
const offlineCount = document.getElementById('offlineCount');
const retryOfflineButton = document.getElementById('retryOffline');

// Game instance
let game = null;
let currentSessionData = null;
let currentTimer = null;
let currentTimeLeft = 0;

// Initialize
function init() {
  // Sound toggle
  soundToggle.addEventListener('click', () => {
    const muted = sound.toggleMute();
    soundToggle.classList.toggle('muted', muted);
  });

  // Initialize sound button state
  soundToggle.classList.toggle('muted', sound.isMuted());

  // Check for offline scores
  checkOfflineScores();

  // Session code input - auto check when 4 characters
  sessionCodeInput.addEventListener('input', async (e) => {
    const code = e.target.value.toUpperCase();
    sessionCodeInput.value = code;

    if (code.length === 4) {
      await checkSession(code);
    } else {
      // Hide team selection if code incomplete
      teamSelection.style.display = 'none';
      nicknameGroup.style.display = 'none';
      startButton.disabled = true;
    }
  });

  // Start form submit
  startForm.addEventListener('submit', handleStartGame);

  // Answer buttons
  bolehButton.addEventListener('click', () => handleAnswer('boleh'));
  janganButton.addEventListener('click', () => handleAnswer('jangan'));

  // Continue button
  continueButton.addEventListener('click', handleContinue);

  // Play again
  playAgainButton.addEventListener('click', handlePlayAgain);

  // View leaderboard
  viewLeaderboardButton.addEventListener('click', showLeaderboard);
  closeLeaderboard.addEventListener('click', hideLeaderboard);

  // View toggle in modal
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      loadLeaderboardData(e.target.dataset.view);
    });
  });

  // Retry offline
  retryOfflineButton.addEventListener('click', handleRetryOffline);
}

async function checkSession(code) {
  try {
    startButton.disabled = true;
    startButton.textContent = 'MEMERIKSA...';

    const data = await getSession(code);
    currentSessionData = data;

    // Show team selection
    teamButtons.innerHTML = '';
    data.teams.forEach(team => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'team-button';
      button.style.backgroundColor = team.color;
      button.style.color = '#ffffff';
      button.textContent = team.team_name;
      button.dataset.teamId = team.id;

      button.addEventListener('click', () => {
        document.querySelectorAll('.team-button').forEach(b => {
          b.classList.remove('selected');
        });
        button.classList.add('selected');
        
        // Show nickname input
        nicknameGroup.style.display = 'block';
        nicknameInput.focus();
      });

      teamButtons.appendChild(button);
    });

    teamSelection.style.display = 'block';
    startButton.textContent = 'MULAI BERMAIN';
    startButton.disabled = false;

  } catch (error) {
    alert('❌ ' + error.message);
    startButton.textContent = 'MULAI BERMAIN';
    startButton.disabled = true;
    teamSelection.style.display = 'none';
    nicknameGroup.style.display = 'none';
  }
}

function handleStartGame(e) {
  e.preventDefault();

  const selectedTeamButton = document.querySelector('.team-button.selected');
  if (!selectedTeamButton) {
    alert('Pilih tim dulu ya!');
    return;
  }

  const teamId = parseInt(selectedTeamButton.dataset.teamId);
  const nickname = nicknameInput.value.trim();

  if (!nickname || nickname.length < 2) {
    alert('Nama panggilan harus minimal 2 karakter');
    return;
  }

  // Initialize sound on first user interaction
  sound.init();

  // Initialize game
  game = new Game();
  game.init(currentSessionData, teamId, nickname);

  // Start game
  showScreen(gameScreen);
  startRound();
}

function startRound() {
  updateGameDisplay();
  showCard();
}

function showCard() {
  if (!game.hasMoreCards()) {
    endGame();
    return;
  }

  const card = game.getCurrentCard();
  
  cardNumber.textContent = game.currentCardIndex + 1;
  cardIcon.textContent = card.icon;
  cardText.textContent = card.text;

  // Enable buttons
  bolehButton.disabled = false;
  janganButton.disabled = false;

  // Start timer
  startTimer();
}

function startTimer() {
  currentTimeLeft = GAME_CONFIG.timePerCard;
  timerBar.style.width = '100%';

  clearInterval(currentTimer);
  currentTimer = setInterval(() => {
    currentTimeLeft -= 0.1;
    const percentage = (currentTimeLeft / GAME_CONFIG.timePerCard) * 100;
    timerBar.style.width = percentage + '%';

    if (currentTimeLeft <= 0) {
      clearInterval(currentTimer);
      handleAnswer(null); // Time out = wrong answer
    }
  }, 100);
}

function handleAnswer(playerAnswer) {
  clearInterval(currentTimer);

  // Disable buttons
  bolehButton.disabled = true;
  janganButton.disabled = true;

  if (!playerAnswer) {
    // Time out
    const result = game.answerCard('timeout');
    showFeedback(result);
    return;
  }

  const result = game.answerCard(playerAnswer);
  showFeedback(result);
}

function showFeedback(result) {
  updateGameDisplay();

  if (result.correct) {
    // Flash green
    cardDisplay.classList.add('flash-correct');
    setTimeout(() => cardDisplay.classList.remove('flash-correct'), 500);

    // Wait a bit then next card
    setTimeout(() => {
      game.nextCard();
      if (game.isGameOver()) {
        endGame();
      } else {
        showCard();
      }
    }, 800);

  } else {
    // Flash red
    cardDisplay.classList.add('flash-wrong');
    setTimeout(() => cardDisplay.classList.remove('flash-wrong'), 500);

    // Update lives display
    updateLives();

    // Show explanation
    if (game.isGameOver()) {
      // Game over, show explanation then end
      setTimeout(() => {
        showExplanation(result.card, false);
      }, 500);
    } else {
      // Continue, show explanation
      setTimeout(() => {
        showExplanation(result.card, true);
      }, 500);
    }
  }
}

function showExplanation(card, willContinue) {
  explanationTitle.textContent = willContinue ? 'Hampir!' : 'Game Selesai!';
  explanationText.textContent = card.alasan;
  explanationMascot.textContent = willContinue ? '🤖' : '😢';
  continueButton.textContent = willContinue ? 'LANJUT' : 'LIHAT HASIL';
  
  explanationOverlay.classList.add('active');
}

function handleContinue() {
  explanationOverlay.classList.remove('active');
  
  if (game.isGameOver()) {
    endGame();
  } else {
    game.nextCard();
    showCard();
  }
}

function updateGameDisplay() {
  scoreDisplay.textContent = game.score;
  correctDisplay.textContent = `${game.correctCount}/10`;
  comboDisplay.textContent = game.combo;

  // Animate combo
  if (game.combo >= 3) {
    comboDisplay.classList.add('active');
    setTimeout(() => comboDisplay.classList.remove('active'), 500);
  }

  updateLives();
}

function updateLives() {
  const hearts = livesDisplay.querySelectorAll('.heart');
  hearts.forEach((heart, index) => {
    if (index >= game.lives) {
      heart.classList.add('lost');
    } else {
      heart.classList.remove('lost');
    }
  });
}

async function endGame() {
  clearInterval(currentTimer);

  const results = game.getResults();

  // Update results display
  titleEmoji.textContent = results.emoji;
  titleText.textContent = results.title;
  finalScore.textContent = results.score;
  finalCorrect.textContent = `${results.correctCount}/${results.totalCards}`;
  finalCombo.textContent = results.bestCombo;

  // Mascot based on results
  if (results.score >= 90) {
    resultsMascot.textContent = '🎉';
    resultsTitle.textContent = 'Luar Biasa!';
    sound.playVictory();
    showConfetti();
  } else if (results.score >= 50) {
    resultsMascot.textContent = '👍';
    resultsTitle.textContent = 'Bagus Sekali!';
    sound.playVictory();
  } else {
    resultsMascot.textContent = '💪';
    resultsTitle.textContent = 'Tetap Semangat!';
    sound.playGameOver();
  }

  // Save score
  saveStatus.textContent = '💾 Menyimpan skor...';
  saveStatus.className = 'save-status';

  const saveResult = await game.saveScore();

  if (saveResult.success && !saveResult.offline) {
    saveStatus.textContent = '✅ Skor berhasil disimpan!';
    saveStatus.className = 'save-status success';
  } else if (saveResult.offline) {
    saveStatus.textContent = '📦 Skor disimpan offline. Akan dikirim otomatis saat online.';
    saveStatus.className = 'save-status offline';
    checkOfflineScores();
  } else {
    saveStatus.textContent = '⚠️ Gagal menyimpan skor: ' + saveResult.error;
    saveStatus.className = 'save-status error';
  }

  showScreen(resultsScreen);
}

function handlePlayAgain() {
  // Reset form but keep session code
  const selectedTeam = document.querySelector('.team-button.selected');
  if (selectedTeam) {
    selectedTeam.classList.remove('selected');
  }
  nicknameInput.value = '';
  nicknameGroup.style.display = 'none';

  showScreen(startScreen);
}

function showScreen(screen) {
  [startScreen, gameScreen, resultsScreen].forEach(s => {
    s.classList.remove('active');
  });
  screen.classList.add('active');
}

function checkOfflineScores() {
  const offline = getOfflineScores();
  if (offline.length > 0) {
    offlineCount.textContent = offline.length;
    offlineScoresNotice.style.display = 'block';
  } else {
    offlineScoresNotice.style.display = 'none';
  }
}

async function handleRetryOffline() {
  retryOfflineButton.disabled = true;
  retryOfflineButton.textContent = 'Mengirim...';

  try {
    const results = await Game.retryOffline();
    const success = results.filter(r => r.success).length;
    const failed = results.length - success;

    if (failed === 0) {
      alert(`✅ Semua ${success} skor berhasil dikirim!`);
    } else {
      alert(`✅ ${success} skor berhasil dikirim\n❌ ${failed} skor gagal`);
    }

    checkOfflineScores();
  } catch (error) {
    alert('❌ Gagal mengirim skor offline');
  } finally {
    retryOfflineButton.disabled = false;
    retryOfflineButton.textContent = 'Kirim Ulang';
  }
}

// Confetti effect
function showConfetti() {
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const particles = [];
  const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCF7F', '#FF9A56'];

  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 4,
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let anyVisible = false;

    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      
      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y < canvas.height) {
        anyVisible = true;
      }
    });

    if (anyVisible) {
      requestAnimationFrame(animate);
    } else {
      canvas.style.display = 'none';
    }
  }

  animate();
}

// Initialize app
init();


// Leaderboard modal functions
function showLeaderboard() {
  if (!currentSessionData) {
    alert('Tidak ada data sesi');
    return;
  }

  leaderboardModal.classList.add('active');
  loadLeaderboardData('individual');
}

function hideLeaderboard() {
  leaderboardModal.classList.remove('active');
}

async function loadLeaderboardData(type) {
  if (!currentSessionData) return;

  leaderboardContent.innerHTML = '<p class="loading-text">Memuat...</p>';

  try {
    const data = await getLeaderboard(currentSessionData.session.code, type);

    if (type === 'individual') {
      displayIndividualLeaderboard(data.leaderboard);
    } else {
      displayTeamLeaderboard(data.leaderboard);
    }
  } catch (error) {
    leaderboardContent.innerHTML = `<p class="loading-text">❌ ${error.message}</p>`;
  }
}

function displayIndividualLeaderboard(leaderboard) {
  if (leaderboard.length === 0) {
    leaderboardContent.innerHTML = '<p class="loading-text">Belum ada data</p>';
    return;
  }

  let html = `
    <table class="leaderboard-table-player">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Nama</th>
          <th>Tim</th>
          <th>Skor</th>
          <th>Benar</th>
          <th>Combo</th>
        </tr>
      </thead>
      <tbody>
  `;

  leaderboard.forEach((entry, index) => {
    const rank = index + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

    html += `
      <tr>
        <td><span class="rank-display ${rankClass}">${rankEmoji || rank}</span></td>
        <td><strong>${escapeHtml(entry.nickname)}</strong></td>
        <td><span class="team-badge-small" style="background-color: ${entry.teamColor}">${escapeHtml(entry.teamName)}</span></td>
        <td><span class="score-display">${entry.score}</span></td>
        <td>${entry.correct}/10</td>
        <td>${entry.bestCombo}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  leaderboardContent.innerHTML = html;
}

function displayTeamLeaderboard(teams) {
  if (teams.length === 0) {
    leaderboardContent.innerHTML = '<p class="loading-text">Belum ada data</p>';
    return;
  }

  let html = '<div class="team-leaderboard-grid">';

  teams.forEach((team, index) => {
    const rank = index + 1;
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank === 4 ? '4️⃣' : `#${rank}`;

    html += `
      <div class="team-card-item" style="border-color: ${team.color}">
        <div class="team-rank-display">${rankEmoji}</div>
        <div class="team-name-display" style="color: ${team.color}">${escapeHtml(team.teamName)}</div>
        <div class="team-score-display">${team.totalScore}</div>
        <div class="team-meta-display">
          ${team.playerCount} pemain · Rata-rata: ${team.avgScore}
        </div>
      </div>
    `;
  });

  html += '</div>';
  leaderboardContent.innerHTML = html;
}

// Utility function
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Close modal when clicking outside
leaderboardModal.addEventListener('click', (e) => {
  if (e.target === leaderboardModal) {
    hideLeaderboard();
  }
});
