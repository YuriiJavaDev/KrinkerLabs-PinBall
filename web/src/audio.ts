// Sounds are synthesised with WebAudio; there are no audio files.
export class Sound {
  private ctx: AudioContext | null = null; private master!: GainNode; muted = false;
  private noiseBuf!: AudioBuffer;
  /** Must be called from a user gesture (click/key). */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as any).webkitAudioContext; if (!AC) return;
    this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.55;
    const comp = this.ctx.createDynamicsCompressor(); this.master.connect(comp); comp.connect(this.ctx.destination);
    this.noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  setMuted(m: boolean) { this.muted = m; if (this.ctx) this.master.gain.value = m ? 0 : 0.55; }
  private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  private noise(dur: number, vol: number, f0: number, f1: number, q = 1, type: BiquadFilterType = 'bandpass', delay = 0) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; const fl = c.createBiquadFilter(), g = c.createGain();
    fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(this.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  flipper(up: boolean) { if (up) { this.tone('sine', 150, 55, 0.09, 0.5); this.noise(0.03, 0.35, 2500, 1500, 2); } else { this.tone('sine', 90, 50, 0.05, 0.22); this.noise(0.02, 0.18, 1800, 1200, 2); } }
  bumper(i: number) { const base = [523, 659, 784, 880, 988][i % 5]; this.tone('triangle', base * 2, base, 0.18, 0.4); this.tone('sine', base * 3, base * 2, 0.12, 0.18); this.noise(0.04, 0.25, 3000, 1200, 3); }
  stone(speed: number) { this.tone('sine', 200, 90, 0.08, Math.min(0.4, speed / 2500)); this.noise(0.05, Math.min(0.3, speed / 3000), 900, 400, 2); }
  wall(speed: number) { const v = Math.min(0.28, speed / 3000); if (v > 0.015) this.noise(0.04, v, 2200, 900, 3); }
  sling() { this.tone('square', 420, 160, 0.09, 0.2); this.noise(0.03, 0.3, 3500, 1800, 2); }
  launch(p: number) { this.noise(0.5, 0.35, 300, 3000 + p * 2000, 1.2, 'bandpass'); this.tone('sawtooth', 120, 400 + 300 * p, 0.35, 0.12); }
  drain() { this.tone('triangle', 440, 70, 0.9, 0.35); this.tone('sine', 330, 55, 1.0, 0.25, 0.1); }
  tilt() { this.tone('sawtooth', 95, 80, 0.6, 0.35); this.tone('square', 92, 78, 0.6, 0.15); }
  start() { [523, 659, 784, 1047].forEach((f, i) => this.tone('triangle', f, f * 1.003, 0.22, 0.28, i * 0.09)); }
  over() { [784, 659, 523, 392].forEach((f, i) => this.tone('triangle', f, f * 0.99, 0.3, 0.28, i * 0.14)); }
  target(drop: boolean) { this.tone('square', drop ? 700 : 520, drop ? 300 : 460, 0.07, 0.22); this.noise(0.03, 0.3, 4000, 2500, 3); }
  bank() { [523, 659, 784, 988, 1175].forEach((f, i) => this.tone('triangle', f, f * 1.002, 0.16, 0.3, i * 0.06)); }
  lane(done: boolean) { this.tone('sine', done ? 1175 : 880, done ? 1760 : 1100, 0.14, 0.3); if (done) [784, 988, 1319].forEach((f, i) => this.tone('triangle', f, f, 0.2, 0.25, 0.08 + i * 0.07)); }
  spin() { this.tone('square', 1500, 1300, 0.025, 0.08); }
  saucer(eject: boolean) { if (eject) { this.tone('sawtooth', 160, 700, 0.18, 0.3); this.noise(0.12, 0.35, 700, 2600, 1); } else { this.tone('sine', 300, 90, 0.25, 0.4); } }
  save() { [880, 660, 880, 1100].forEach((f, i) => this.tone('triangle', f, f, 0.12, 0.28, i * 0.08)); }
}
