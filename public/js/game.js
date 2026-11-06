import { GAME_CONFIG, getRandomCards, getTitle } from './cards.js';
import { sound } from './sound.js';
import { submitScore, saveOfflineScore, retryOfflineScores } from './api.js';

class Game {
  constructor() {
    this.sessionData = null;
    this.selectedTeam = null;
    this.playerNickname = null;
    this.currentCards = [];
    this.currentCardIndex = 0;
    this.score = 0;
    this.correctCount = 0;
    this.lives = GAME_CONFIG.startingLives;
    this.combo = 0;
    this.bestCombo = 0;
    this.answers = [];
    this.timer = null;
    this.roundId = null;
  }

  // Initialize game with session data
  init(sessionData, teamId, nickname) {
    this.sessionData = sessionData;
    this.selectedTeam = sessionData.teams.find(t => t.id === teamId);
    this.playerNickname = nickname;
    this.currentCards = getRandomCards();
    this.currentCardIndex = 0;
    this.score = 0;
    this.correctCount = 0;
    this.lives = GAME_CONFIG.startingLives;
    this.combo = 0;
    this.bestCombo = 0;
    this.answers = [];
    this.roundId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentCard() {
    return this.currentCards[this.currentCardIndex];
  }

  answerCard(playerAnswer) {
    const card = this.getCurrentCard();
    const correct = (playerAnswer === 'boleh' && card.boleh) || 
                   (playerAnswer === 'jangan' && !card.boleh);

    this.answers.push({
      id: card.id,
      correct
    });

    if (correct) {
      this.handleCorrectAnswer();
    } else {
      this.handleWrongAnswer();
    }

    return {
      correct,
      card,
      combo: this.combo,
      score: this.score,
      lives: this.lives
    };
  }

  handleCorrectAnswer() {
    this.combo++;
    if (this.combo > this.bestCombo) {
      this.bestCombo = this.combo;
    }

    // Calculate points with combo bonus
    let points = GAME_CONFIG.pointsPerCorrect;
    
    if (this.combo >= 5) {
      points += GAME_CONFIG.comboBonus[5];
    } else if (this.combo >= 3) {
      points += GAME_CONFIG.comboBonus[3];
    }

    this.score += points;
    this.correctCount++;

    sound.playCorrect();

    // Play combo sound on milestones
    if (this.combo === 3 || this.combo === 5) {
      setTimeout(() => sound.playCombo(), 200);
    }
  }

  handleWrongAnswer() {
    this.combo = 0;
    this.lives--;

    sound.playWrong();

    if (this.lives > 0) {
      sound.playLifeLost();
    }
  }

  nextCard() {
    this.currentCardIndex++;
  }

  isGameOver() {
    return this.lives <= 0 || this.currentCardIndex >= this.currentCards.length;
  }

  hasMoreCards() {
    return this.currentCardIndex < this.currentCards.length;
  }

  getResults() {
    const titleData = getTitle(this.score);
    
    return {
      score: this.score,
      correctCount: this.correctCount,
      totalCards: this.currentCards.length,
      bestCombo: this.bestCombo,
      title: titleData.title,
      emoji: titleData.emoji,
      livesLeft: this.lives
    };
  }

  async saveScore() {
    const scoreData = {
      code: this.sessionData.session.code,
      teamId: this.selectedTeam.id,
      nickname: this.playerNickname,
      score: this.score,
      correct: this.correctCount,
      bestCombo: this.bestCombo,
      roundId: this.roundId,
      answers: this.answers
    };

    try {
      await submitScore(scoreData);
      return { success: true, offline: false };
    } catch (error) {
      console.warn('Failed to submit online, saving offline:', error);
      const saved = saveOfflineScore(scoreData);
      return { success: saved, offline: true, error: error.message };
    }
  }

  static async retryOffline() {
    return await retryOfflineScores();
  }
}

export { Game };
