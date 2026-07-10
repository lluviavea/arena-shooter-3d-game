export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicNodes = [];
    this.currentTier = 0;
    this.initialized = false;
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

    const configs = [
      // Tier 1 - Training: calm, soft, friendly
      {
        base: 220,
        padFreqs: [220, 277, 330],
        padGain: 0.04,
        padFilterFreq: 600,
        lfoRate: 0.3,
        lfoDepth: 5,
        droneFreq: 110,
        droneGain: 0.03,
        pulseRate: 0.5,
      },
      // Tier 2 - Patrol: slightly tense, medium
      {
        base: 246,
        padFreqs: [246, 311, 370],
        padGain: 0.05,
        padFilterFreq: 800,
        lfoRate: 0.5,
        lfoDepth: 8,
        droneFreq: 123,
        droneGain: 0.04,
        pulseRate: 0.8,
      },
      // Tier 3 - Assault: intense, driving
      {
        base: 293,
        padFreqs: [293, 370, 440],
        padGain: 0.06,
        padFilterFreq: 1200,
        lfoRate: 0.8,
        lfoDepth: 15,
        droneFreq: 146,
        droneGain: 0.05,
        pulseRate: 1.2,
      },
      // Tier 4 - Warzone: aggressive, dark
      {
        base: 329,
        padFreqs: [329, 415, 493],
        padGain: 0.07,
        padFilterFreq: 1600,
        lfoRate: 1.0,
        lfoDepth: 20,
        droneFreq: 164,
        droneGain: 0.06,
        pulseRate: 1.6,
      },
      // Tier 5 - Annihilation: extreme, menacing
      {
        base: 369,
        padFreqs: [369, 466, 554],
        padGain: 0.08,
        padFilterFreq: 2000,
        lfoRate: 1.3,
        lfoDepth: 25,
        droneFreq: 184,
        droneGain: 0.07,
        pulseRate: 2.0,
      },
    ];

    const cfg = configs[Math.min(tier - 1, configs.length - 1)];

    // LFO
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = cfg.lfoRate;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = cfg.lfoDepth;
    lfo.connect(lfoGain);

    // Pad voices
    for (const freq of cfg.padFreqs) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cfg.padFilterFreq;
      lfoGain.connect(filter.frequency);

      const gain = this.ctx.createGain();
      gain.gain.value = cfg.padGain;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      this.musicNodes.push({ osc, gain, filter });
    }

    // Drone
    const droneOsc = this.ctx.createOscillator();
    droneOsc.type = "triangle";
    droneOsc.frequency.value = cfg.droneFreq;
    const droneGain = this.ctx.createGain();
    droneGain.gain.value = cfg.droneGain;
    droneOsc.connect(droneGain);
    droneGain.connect(this.masterGain);
    droneOsc.start(now);
    this.musicNodes.push({ osc: droneOsc, gain: droneGain });

    // Pulse
    const pulseOsc = this.ctx.createOscillator();
    pulseOsc.type = "square";
    pulseOsc.frequency.value = cfg.pulseRate;
    const pulseGain = this.ctx.createGain();
    pulseGain.gain.value = 0.02;
    const pulseFilter = this.ctx.createBiquadFilter();
    pulseFilter.type = "lowpass";
    pulseFilter.frequency.value = 200;
    pulseOsc.connect(pulseFilter);
    pulseFilter.connect(pulseGain);
    pulseGain.connect(this.masterGain);
    pulseOsc.start(now);
    this.musicNodes.push({ osc: pulseOsc, gain: pulseGain, filter: pulseFilter });

    lfo.start(now);
    this.musicNodes.push({ osc: lfo, gain: lfoGain });
  }

  stopMusic() {
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
