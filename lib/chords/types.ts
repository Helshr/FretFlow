export type Quality = 'Major' | 'Minor' | 'm7' | 'Maj7' | '7' | '5';

export interface OpenChord {
  name: string;
  shape: 'Open';
  frets: number[];
  fingers: number[];
}

export interface CagedShape {
  id: string;
  quality: Quality;
  rootString: number;
  barre?: { from: number; to: number };
  template: number[];
}

export interface TransposedChord {
  chord: string;
  quality: Quality;
  shape: string;
  rootString: number;
  rootFret: number;
  frets: number[];
  barre: { from: number; to: number } | null;
  key: string;
}

export type PoolItem = TransposedChord | (OpenChord & { key: string });

export interface Settings {
  mode: 'open' | 'caged';
  chordCount: number;
  bpm: number;
  measuresPerChord: 1 | 2 | 4;
  durationMin: number;
  patternId: string; // 鼓点类型（DRUM_PATTERNS 的 id，含 metronome）
  playChord: boolean; // 切到新和弦时播放和弦音
}

export interface ChordDisplay {
  name: string;
  shape: string;
  frets: number[];
  fingers?: number[];
  rootString?: number;
  barre?: { from: number; to: number } | null;
  rootFret?: number;
}
