// Sound effects using Web Audio API (no audio files needed)

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.muted = localStorage.getItem('soundMuted') === 'true';
    this.musicPlaying = false;
    this.bgMusicGain = null;
    this.bgMusicOscillators = [];
  }

  // Initialize audio context (must be called after user interaction)
  init() {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('🔊 Audio initialized');
    } catch (error) {
      console.warn('Audio not supported:', error);
    }
  }

  // Play correct answer sound (ting naik)
  playCorrect() {
    if (this.muted || !this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }

  // Play wrong answer sound (bzz lembut)
  playWrong() {
    if (this.muted || !this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }

  // Play combo sound (arpeggio pendek)
  playCombo() {
    if (this.muted || !this.audioContext) return;

    const ctx = this.audioContext;
    const frequencies = [523, 659, 784]; // C, E, G

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + (index * 0.08);
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    });
  }

  // Play life lost sound
  playLifeLost() {
    if (this.muted || !this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
    oscillator.type = 'triangle';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  }

  // Play game over sound
  playGameOver() {
    if (this.muted || !this.audioContext) return;

    const ctx = this.audioContext;
    const frequencies = [400, 350, 300, 250];

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + (index * 0.2);
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }

  // Play victory sound
  playVictory() {
    if (this.muted || !this.audioContext) return;

    const ctx = this.audioContext;
    const melody = [523, 587, 659, 784]; // C, D, E, G

    melody.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + (index * 0.12);
      gainNode.gain.setValueAtTime(0.25, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    });
  }

  // Simple background music (optional, default OFF)
  startBackgroundMusic() {
    if (this.muted || !this.audioContext || this.musicPlaying) return;

    const ctx = this.audioContext;
    this.bgMusicGain = ctx.createGain();
    this.bgMusicGain.gain.value = 0.05; // Very low volume
    this.bgMusicGain.connect(ctx.destination);

    // Simple chord progression loop
    const notes = [262, 330, 392]; // C major chord
    this.bgMusicOscillators = [];

    notes.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.type = 'sine';
      osc.connect(this.bgMusicGain);
      osc.start();
      this.bgMusicOscillators.push(osc);
    });

    this.musicPlaying = true;
  }

  stopBackgroundMusic() {
    if (!this.musicPlaying) return;

    this.bgMusicOscillators.forEach(osc => osc.stop());
    this.bgMusicOscillators = [];
    this.musicPlaying = false;
  }

  // Toggle mute
  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('soundMuted', this.muted);

    if (this.muted && this.musicPlaying) {
      this.stopBackgroundMusic();
    }

    return this.muted;
  }

  isMuted() {
    return this.muted;
  }
}

// Export singleton instance
export const sound = new SoundManager();
