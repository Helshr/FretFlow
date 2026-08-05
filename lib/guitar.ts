// 吉他标准调弦数据（唯一来源）

export interface GuitarString {
  string: number; // 6..1
  note: string;
  semitone: number; // C=0
  freq: number; // 空弦基频
}

export const GUITAR_STRINGS: GuitarString[] = [
  {string: 6, note: 'E', semitone: 4, freq: 82.41}, // E2
  {string: 5, note: 'A', semitone: 9, freq: 110.0}, // A2
  {string: 4, note: 'D', semitone: 2, freq: 146.83}, // D3
  {string: 3, note: 'G', semitone: 7, freq: 196.0}, // G3
  {string: 2, note: 'B', semitone: 11, freq: 246.94}, // B3
  {string: 1, note: 'E', semitone: 4, freq: 329.63}, // E4
];

export const OPEN_SEMITONE: Record<number, number> = Object.fromEntries(
  GUITAR_STRINGS.map((s) => [s.string, s.semitone]),
);

export const OPEN_FREQ: Record<number, number> = Object.fromEntries(
  GUITAR_STRINGS.map((s) => [s.string, s.freq]),
);
