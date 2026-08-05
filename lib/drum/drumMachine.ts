/**
 * Web Audio 合成鼓机，lookahead 调度。
 * 鼓点由数据（DRUM_PATTERNS）驱动，每种风格定义 16 分步进下各打击乐的出现位置。
 * 只在浏览器端使用；AudioContext 在 start()（用户手势）里惰性创建。
 */
export interface DrumPattern {
  id: string;
  kick: number[]; // 16 分步进下标：底鼓
  snare: number[]; // 军鼓
  hat: number[]; // 踩镲
  hatAccent: number[]; // 踩镲重音
}

export const DRUM_PATTERNS: DrumPattern[] = [
  {
    id: 'rock',
    kick: [0, 8],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    hatAccent: [0, 4, 8, 12],
  },
  {
    id: 'pop',
    kick: [0, 8],
    snare: [4, 12],
    hat: [0, 4, 8, 12],
    hatAccent: [],
  },
  {
    id: 'funk',
    kick: [0, 3, 8, 11],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    hatAccent: [0, 8],
  },
  {
    id: 'metronome',
    kick: [],
    snare: [],
    hat: [],
    hatAccent: [],
  },
];

export class DrumMachine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private step = 0;
  private bpm = 120;
  private pattern: DrumPattern = DRUM_PATTERNS[0];
  private onBar: (() => void) | null = null;
  running = false;

  start(bpm: number, onBar: () => void, patternId = 'rock'): void {
    if (typeof window === 'undefined') return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!this.ctx) this.ctx = new AC();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (!this.master) {
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.ctx.destination);
    }
    this.ensureNoise();
    this.pattern = DRUM_PATTERNS.find((p) => p.id === patternId) ?? DRUM_PATTERNS[0];
    this.bpm = bpm;
    this.onBar = onBar;
    if (!this.running) {
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.06;
      this.running = true;
    }
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 25);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    if (!this.ctx) return;
    const spb = 60 / this.bpm / 4; // 每个 16 分音符的秒数
    while (this.nextTime < this.ctx.currentTime + 0.1) {
      this.scheduleStep(this.step, this.nextTime);
      this.nextTime += spb;
      this.step = (this.step + 1) % 16;
      if (this.step === 0 && this.onBar) this.onBar();
    }
  }

  private scheduleStep(s: number, t: number): void {
    if (this.pattern.id === 'metronome') {
      if (s % 4 === 0) this.click(t, s === 0); // 每拍一次，第 1 拍重音
      return;
    }
    const p = this.pattern;
    if (p.kick.includes(s)) this.kick(t);
    if (p.snare.includes(s)) this.snare(t);
    if (p.hat.includes(s)) this.hat(t, p.hatAccent.includes(s));
  }

  // 节拍器 click：短促高音，重音更高更响
  private click(t: number, accent: boolean): void {
    if (!this.ctx || !this.master) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.value = accent ? 1760 : 1175;
    g.gain.setValueAtTime(accent ? 0.45 : 0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + 0.08);
  }

  private ensureNoise(): void {
    if (!this.ctx || this.noiseBuf) return;
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  }

  private kick(t: number): void {
    if (!this.ctx || !this.master) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.1);
    g.gain.setValueAtTime(1.0, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + 0.3);
  }

  private snare(t: number): void {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const s = this.ctx.createBufferSource();
    const bp = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    s.buffer = this.noiseBuf;
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 1;
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    s.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    s.start(t);
    s.stop(t + 0.2);
  }

  private hat(t: number, acc: boolean): void {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const s = this.ctx.createBufferSource();
    const hp = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    s.buffer = this.noiseBuf;
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    g.gain.setValueAtTime(acc ? 0.4 : 0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (acc ? 0.08 : 0.05));
    s.connect(hp);
    hp.connect(g);
    g.connect(this.master);
    s.start(t);
    s.stop(t + 0.1);
  }
}

export const drumMachine = new DrumMachine();
