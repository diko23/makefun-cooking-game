// Procedural WebAudio synthesizer for Hearth & Skillet (zero external assets).

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastSizzleAt = 0;
  }

  unlock() {
    if (this.muted) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, duration, type = 'triangle', gainVal = 0.14, delay = 0, slideTo = null) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  noiseBurst(duration, filterFreq = 1800, gainVal = 0.06) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1.6;

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  playPickup() {
    this.tone(420, 0.08, 'sine', 0.1, 0, 580);
  }

  playPlace() {
    this.tone(290, 0.07, 'triangle', 0.11, 0, 220);
  }

  playChop() {
    this.tone(175, 0.06, 'square', 0.08, 0, 95);
    this.noiseBurst(0.045, 2200, 0.07);
  }

  playChopDone() {
    this.tone(520, 0.08, 'triangle', 0.11, 0, 740);
    this.tone(780, 0.11, 'sine', 0.09, 0.05);
  }

  playSizzle(nowMs) {
    if (nowMs - this.lastSizzleAt < 260) return;
    this.lastSizzleAt = nowMs;
    this.noiseBurst(0.14, 3400, 0.025);
  }

  playCookReady() {
    this.tone(880, 0.14, 'sine', 0.13, 0);
    this.tone(1174, 0.22, 'sine', 0.12, 0.09);
  }

  playPlate() {
    this.tone(620, 0.08, 'triangle', 0.11, 0, 780);
  }

  playServe() {
    this.tone(523.25, 0.11, 'triangle', 0.14, 0);
    this.tone(659.25, 0.11, 'triangle', 0.14, 0.07);
    this.tone(783.99, 0.14, 'triangle', 0.15, 0.14);
    this.tone(1046.5, 0.24, 'sine', 0.15, 0.21);
  }

  playDash() {
    this.noiseBurst(0.12, 950, 0.06);
  }

  playRush() {
    this.tone(330, 0.14, 'sawtooth', 0.11, 0);
    this.tone(440, 0.14, 'sawtooth', 0.11, 0.12);
    this.tone(660, 0.28, 'sawtooth', 0.13, 0.24);
  }

  playTick() {
    this.tone(940, 0.045, 'square', 0.05, 0);
  }

  playError() {
    this.tone(170, 0.14, 'sawtooth', 0.1, 0, 120);
  }

  playBurn() {
    this.tone(145, 0.26, 'sawtooth', 0.13, 0, 82);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => this.tone(n, 0.24, 'triangle', 0.14, idx * 0.1));
  }

  playLose() {
    this.tone(310, 0.2, 'sawtooth', 0.12, 0, 240);
    this.tone(220, 0.35, 'sawtooth', 0.12, 0.2, 150);
  }
}
