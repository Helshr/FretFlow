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

// 语音念出音名
export function speakNote(note: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(note);
  u.lang = 'en-US';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

// Web Audio 单音/和弦合成
// 加法合成模拟拨弦：基音 + 多个谐波，幅度约 1/n，高次谐波衰减更快，快速起音模拟拨弦瞬态。
const PARTIALS = [
  {mult: 1, amp: 1.0, decay: 1.0},
  {mult: 2, amp: 0.55, decay: 0.7},
  {mult: 3, amp: 0.35, decay: 0.5},
  {mult: 4, amp: 0.22, decay: 0.35},
  {mult: 5, amp: 0.15, decay: 0.28},
  {mult: 6, amp: 0.1, decay: 0.22},
];

class TonePlayer {
  // 单个音：多个谐波正弦 + 各自的增益包络
  private tone(freq: number, peak: number, duration: number): void {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    PARTIALS.forEach((p) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * p.mult;
      const d = Math.max(0.1, duration * p.decay);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak * p.amp, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, now + d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + d + 0.05);
    });
  }

  play(freq: number, duration = 0.4): void {
    this.tone(freq, 0.6, duration);
  }

  // 同时奏响多个音高（和弦）；单音音量调低避免削波
  playChord(freqs: number[], duration = 1.2): void {
    freqs.forEach((f) => {
      if (f > 0) this.tone(f, 0.35, duration);
    });
  }
}

export const tonePlayer = new TonePlayer();
