// 音符数据与播放助手（浏览器 API，均加 typeof window 守卫）

import {getAudioContext} from '../audio';
import {OPEN_FREQ, OPEN_SEMITONE} from '../guitar';

export const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const CHROMATIC_NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

// 音名 → 半音（C=0）
export const NOTE_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
};

// 空弦音（半音，C=0）与空弦基频（标准调弦）——定义在 lib/guitar.ts
export {OPEN_FREQ, OPEN_SEMITONE};

export interface NotePosition {
  string: number; // 6..1
  fret: number; // 0..12，0=空弦
  freq: number;
}

// 某音在所有弦 0..12 品的出现位置（6→1 弦，每弦内品位升序，含空弦）
export function notePositions(noteSemi: number): NotePosition[] {
  const target = ((noteSemi % 12) + 12) % 12;
  const out: NotePosition[] = [];
  for (let s = 6; s >= 1; s--) {
    for (let f = 0; f <= 12; f++) {
      if ((OPEN_SEMITONE[s] + f) % 12 === target) {
        out.push({string: s, fret: f, freq: OPEN_FREQ[s] * Math.pow(2, f / 12)});
      }
    }
  }
  return out;
}

// 某弦某品的音名 + 八度，如 "E3"
export function noteNameAt(string: number, fret: number): string {
  const freq = OPEN_FREQ[string] * Math.pow(2, fret / 12);
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  return CHROMATIC_NOTES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

// 语音念出音名
export function speakNote(note: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(note);
  u.lang = 'en-US';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

// 吉他发声：真实采样（tonejs-instrument-guitar-acoustic-wav，CC-BY 3.0）经 jsDelivr CDN 按需加载。
// 每个音映射到最近的半音采样，用 playbackRate 微调（≤1 半音，失真极小）；采样加载失败时降级为加法合成。
const SAMPLE_BASE_URL = 'https://cdn.jsdelivr.net/npm/tonejs-instrument-guitar-acoustic-wav@1.1.0/';
const SAMPLE_GAIN = 0.8; // 单音音量
const CHORD_GAIN = 0.5; // 和弦单音音量（多音同奏防削波）

// 半音采样表（MIDI 音符号 → 包内文件名），E2..D5 按序
const SAMPLES: {midi: number; file: string}[] = [
  {midi: 38, file: 'D2'}, {midi: 39, file: 'Ds2'}, {midi: 40, file: 'E2'},
  {midi: 41, file: 'F2'}, {midi: 42, file: 'Fs2'}, {midi: 43, file: 'G2'},
  {midi: 44, file: 'Gs2'}, {midi: 45, file: 'A2'}, {midi: 46, file: 'As2'},
  {midi: 47, file: 'B2'}, {midi: 48, file: 'C3'}, {midi: 49, file: 'Cs3'},
  {midi: 50, file: 'D3'}, {midi: 51, file: 'Ds3'}, {midi: 52, file: 'E3'},
  {midi: 53, file: 'F3'}, {midi: 54, file: 'Fs3'}, {midi: 55, file: 'G3'},
  {midi: 56, file: 'Gs3'}, {midi: 57, file: 'A3'}, {midi: 58, file: 'As3'},
  {midi: 59, file: 'B3'}, {midi: 60, file: 'C4'}, {midi: 61, file: 'Cs4'},
  {midi: 62, file: 'D4'}, {midi: 63, file: 'Ds4'}, {midi: 64, file: 'E4'},
  {midi: 65, file: 'F4'}, {midi: 66, file: 'Fs4'}, {midi: 67, file: 'G4'},
  {midi: 68, file: 'Gs4'}, {midi: 69, file: 'A4'}, {midi: 70, file: 'As4'},
  {midi: 71, file: 'B4'}, {midi: 72, file: 'C5'}, {midi: 73, file: 'Cs5'},
  {midi: 74, file: 'D5'},
];

function nearestSample(midi: number): {file: string; playbackRate: number} {
  let best = SAMPLES[0];
  let bestDiff = Infinity;
  for (const s of SAMPLES) {
    const d = Math.abs(s.midi - midi);
    if (d < bestDiff) {
      bestDiff = d;
      best = s;
    }
  }
  return {file: best.file, playbackRate: Math.pow(2, (midi - best.midi) / 12)};
}

export const SAMPLE_COUNT = SAMPLES.length;

const CACHE_NAME = 'guitar-samples-v1';

class TonePlayer {
  private cache = new Map<string, AudioBuffer>();
  private pending = new Map<string, Promise<AudioBuffer | null>>();

  // 取 WAV 的 ArrayBuffer：内存优先 → Cache API（持久）→ 网络，并写入 Cache API
  private async fetchWav(file: string): Promise<ArrayBuffer | null> {
    const url = SAMPLE_BASE_URL + file + '.wav';
    try {
      if (typeof caches !== 'undefined') {
        const store = await caches.open(CACHE_NAME);
        const hit = await store.match(url);
        if (hit) return await hit.arrayBuffer();
        const res = await fetch(url);
        if (!res.ok) return null;
        void store.put(url, res.clone());
        return await res.arrayBuffer();
      }
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch {
      return null;
    }
  }

  // 加载并缓存采样（并发去重）
  private getBuffer(file: string): Promise<AudioBuffer | null> {
    const cached = this.cache.get(file);
    if (cached) return Promise.resolve(cached);
    const inflight = this.pending.get(file);
    if (inflight) return inflight;
    const p = this.load(file).then((buf) => {
      this.pending.delete(file);
      if (buf) this.cache.set(file, buf);
      return buf;
    });
    this.pending.set(file, p);
    return p;
  }

  private async load(file: string): Promise<AudioBuffer | null> {
    const ctx = getAudioContext();
    if (!ctx) return null;
    const arrayBuf = await this.fetchWav(file);
    if (!arrayBuf) return null;
    try {
      return await ctx.decodeAudioData(arrayBuf);
    } catch {
      return null;
    }
  }

  // 预加载指定频率对应的采样（不发声），保证之后 play 准时
  preload(freqs: number[]): void {
    freqs.forEach((f) => {
      if (f > 0) {
        const midi = Math.round(69 + 12 * Math.log2(f / 440));
        void this.getBuffer(nearestSample(midi).file);
      }
    });
  }

  // 预加载全部采样到 Cache API（不解码，省内存）；带进度回调。重复访问命中缓存会很快。
  async preloadAll(onProgress?: (loaded: number, total: number) => void): Promise<void> {
    const total = SAMPLES.length;
    const useCache = typeof caches !== 'undefined';
    let i = 0;
    let done = 0;
    const worker = async () => {
      while (i < total) {
        const file = SAMPLES[i].file;
        i++;
        if (useCache) {
          await this.fetchWav(file); // 只缓存 WAV，播放时再解码
        } else {
          await this.getBuffer(file); // 无 Cache API 时直接解码进内存
        }
        done++;
        onProgress?.(done, total);
      }
    };
    await Promise.all(Array.from({length: 4}, () => worker()));
  }

  // 播放采样；成功返回 true，失败返回 false（由调用方降级）。when 为音频时间（可选，用于对准拍子）
  private async playSample(freq: number, gain: number, when?: number): Promise<boolean> {
    const ctx = getAudioContext();
    if (!ctx) return false;
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    const {file, playbackRate} = nearestSample(midi);
    const buffer = await this.getBuffer(file);
    if (!buffer) return false;
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buffer;
    src.playbackRate.value = playbackRate;
    g.gain.value = gain;
    src.connect(g);
    g.connect(ctx.destination);
    // 指定时刻在将来则对准播放，否则立即
    src.start(when !== undefined && when > ctx.currentTime ? when : undefined);
    return true;
  }

  // 加法合成（降级用）：基音 + 多个谐波，高次谐波衰减更快，快速起音模拟拨弦
  private tone(freq: number, peak: number, duration: number): void {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const partials = [
      {m: 1, a: 1.0, d: 1.0},
      {m: 2, a: 0.55, d: 0.7},
      {m: 3, a: 0.35, d: 0.5},
      {m: 4, a: 0.22, d: 0.35},
      {m: 5, a: 0.15, d: 0.28},
      {m: 6, a: 0.1, d: 0.22},
    ];
    partials.forEach((p) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * p.m;
      const d = Math.max(0.1, duration * p.d);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak * p.a, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, now + d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + d + 0.05);
    });
  }

  play(freq: number, duration = 0.4): void {
    this.playSample(freq, SAMPLE_GAIN).then((ok) => {
      if (!ok) this.tone(freq, 0.6, duration);
    });
  }

  // 同时奏响多个音高（和弦）；单音音量调低避免削波。when 为音频时间（可选）
  playChord(freqs: number[], duration = 1.2, when?: number): void {
    freqs.forEach((f) => {
      if (f > 0) {
        this.playSample(f, CHORD_GAIN, when).then((ok) => {
          if (!ok) this.tone(f, 0.35, duration);
        });
      }
    });
  }
}

export const tonePlayer = new TonePlayer();
