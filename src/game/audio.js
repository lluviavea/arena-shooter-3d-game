export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicNodes = [];
    this.currentTier = 0;
    this.initialized = false;
    this.beatScheduler = null;
    this.beatPhase = 0;
    this.beatNumber = 0;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playGunshot() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.12, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.12);

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playHit() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playEnemyShot() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playPickup() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playDeath() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300 - i * 60, now + i * 0.12);
      osc.frequency.exponentialRampToValueAtTime(50, now + i * 0.12 + 0.3);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    }
  }

  playVictory() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523, 659, 784, 1047];
    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = notes[i];
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.5);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.5);
    }
  }

  startMusic(tier) {
    this.stopMusic();
    if (!this.ctx) return;
    this.currentTier = tier;
    const now = this.ctx.currentTime;

    // Tempo per tier: ~120 BPM rising to ~150 BPM for the boss
    const bpms = [120, 125, 130, 135, 140, 150];
    const bpm = bpms[Math.min(tier - 1, bpms.length - 1)];
    const beatLen = 60 / bpm; // seconds per beat
    this.beatLen = beatLen;

    // Root notes per tier (A minor-ish groove, rising intensity)
    const roots = [110.0, 116.54, 130.81, 146.83, 164.81, 174.61]; // A2..F3
    const root = roots[Math.min(tier - 1, roots.length - 1)];

    // --- Sustained pad (synth string layer) ---
    const padOscs = [root * 2, root * 2 * 1.5, root * 2 * 2];
    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.025;
    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 900;
    padGain.connect(this.masterGain);
    padFilter.connect(padGain);
    for (const f of padOscs) {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = f;
      osc.connect(padFilter);
      osc.start(now);
      this.musicNodes.push({ osc, gain: padGain, filter: padFilter });
    }

    // --- Drum + bass + arp scheduled via lookahead loop ---
    this.beatNumber = 0;
    this.nextBeatTime = now + 0.05;

    // Arp pattern (pentatonic, 8 steps over 2 beats)
    const arpScale = [root * 4, root * 4 * 1.125, root * 4 * 1.5, root * 4 * 1.6875];
    const arpPattern = [0, 1, 2, 3, 2, 1, 0, 1];

    const scheduleBeat = (beatIndex, time) => {
      const inBar = beatIndex % 4;

      // Kick on every beat (four-on-the-floor)
      this.#kick(time);

      // Closed hat on offbeats (8th note offset)
      this.#hihat(time + beatLen * 0.5, 0.04);

      // Open-ish hat on the "and of 3"
      if (inBar === 2) this.#hihat(time + beatLen * 0.5, 0.07);

      // Bass: root on beats 1 & 3, fifth on 2 & 4 (driving octave bass)
      const bassFreq = inBar === 0 || inBar === 2 ? root : root * 1.5;
      this.#bass(bassFreq, time, beatLen * 0.8);

      // Snare/clap on beats 2 and 4
      if (inBar === 1 || inBar === 3) this.#clap(time);

      // Arp: two notes per beat (16th-ish feel)
      const step = beatIndex % arpPattern.length;
      this.#arp(arpScale[arpPattern[step]], time, beatLen * 0.4);
      this.#arp(arpScale[arpPattern[(step + 2) % arpPattern.length]], time + beatLen * 0.5, beatLen * 0.3);
    };

    const tick = () => {
      if (!this.ctx) return;
      const ahead = 0.15; // schedule 150ms ahead
      while (this.nextBeatTime < this.ctx.currentTime + ahead) {
        scheduleBeat(this.beatNumber, this.nextBeatTime);
        this.beatNumber++;
        this.nextBeatTime += beatLen;
      }
    };

    tick();
    this.beatScheduler = setInterval(tick, 50);
    this._lastTickTime = performance.now();
  }

  #kick(time) {
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.6, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.2);
    this.musicNodes.push({ osc: { stop: (t) => { try { osc.stop(t); } catch (e) {} } }, gain: g });
  }

  #hihat(time, level) {
    const noise = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.05);
    this.musicNodes.push({ osc: noise, gain: g });
  }

  #bass(freq, time, dur) {
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(250, time + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(0.12, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
    this.musicNodes.push({ osc, gain: g });
  }

  #arp(freq, time, dur) {
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = freq;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 3000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(0.05, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
    this.musicNodes.push({ osc, gain: g });
  }

  #clap(time) {
    const noise = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1500;
    filter.Q.value = 1.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.15);
    this.musicNodes.push({ osc: noise, gain: g });
  }

  // Returns current beat phase 0..1 for visual sync (call from game loop)
  getBeatPhase() {
    if (!this.ctx || !this.beatLen) return 0;
    const elapsed = this.ctx.currentTime - (this.nextBeatTime - this.beatLen);
    return Math.max(0, Math.min(1, elapsed / this.beatLen));
  }

  stopMusic() {
    if (this.beatScheduler) {
      clearInterval(this.beatScheduler);
      this.beatScheduler = null;
    }
    for (const node of this.musicNodes) {
      try {
        node.osc.stop();
      } catch (e) {}
    }
    this.musicNodes = [];
  }

  setVolume(v) {
    if (this.masterGain) {
      this.masterGain.gain.value = v;
    }
  }
}
