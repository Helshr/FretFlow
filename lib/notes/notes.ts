// 音符数据与助手（音名、指板位置、语音念音）

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

// 语音念出音名（小写避免 "capital X"；# 显式转成 sharp，否则不会被念出来）
export function speakNote(note: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(note.toLowerCase().replace('#', ' sharp'));
  u.lang = 'en-US';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

// 吉他采样播放器（保持原导入路径）
export {tonePlayer, SAMPLE_COUNT} from './tonePlayer';
