// C 大调七自然音（无升降号）可构成的上行音程（含跨八度），来源为用户提供的权威表（2026-11-23）。
// 每对 (low → high) 有序且唯一对应一个音程；第二个音默认在高八度（如 A–C、F–E）。
// 不含纯八度（C–C 这类同名音八度题，用户要求去掉；P8 仍可作干扰选项）。

export type IntervalId =
  | 'm2' | 'M2' | 'm3' | 'M3' | 'P4' | 'A4' | 'd5' | 'P5' | 'm6' | 'M6' | 'm7' | 'M7' | 'P8';

export interface IntervalType {
  id: IntervalId;
  abbr: string; // 通用缩写（M2 / m3 / P5 …），各语言通用
  semitones: number;
}

export const INTERVAL_TYPES: IntervalType[] = [
  {id: 'm2', abbr: 'm2', semitones: 1},
  {id: 'M2', abbr: 'M2', semitones: 2},
  {id: 'm3', abbr: 'm3', semitones: 3},
  {id: 'M3', abbr: 'M3', semitones: 4},
  {id: 'P4', abbr: 'P4', semitones: 5},
  {id: 'A4', abbr: 'A4', semitones: 6},
  {id: 'd5', abbr: 'd5', semitones: 6},
  {id: 'P5', abbr: 'P5', semitones: 7},
  {id: 'm6', abbr: 'm6', semitones: 8},
  {id: 'M6', abbr: 'M6', semitones: 9},
  {id: 'm7', abbr: 'm7', semitones: 10},
  {id: 'M7', abbr: 'M7', semitones: 11},
  {id: 'P8', abbr: 'P8', semitones: 12},
];

export const INTERVAL_IDS: IntervalId[] = INTERVAL_TYPES.map((t) => t.id);

export interface IntervalQuestion {
  low: string; // 低音音名
  high: string; // 高音音名（位于更高八度）
  id: IntervalId;
}

export const C_MAJOR_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

export const C_INTERVAL_QUESTIONS: IntervalQuestion[] = [
  // 小二度 m2（1）
  {low: 'E', high: 'F', id: 'm2'}, {low: 'B', high: 'C', id: 'm2'},
  // 大二度 M2（2）
  {low: 'C', high: 'D', id: 'M2'}, {low: 'D', high: 'E', id: 'M2'},
  {low: 'F', high: 'G', id: 'M2'}, {low: 'G', high: 'A', id: 'M2'}, {low: 'A', high: 'B', id: 'M2'},
  // 小三度 m3（3）
  {low: 'D', high: 'F', id: 'm3'}, {low: 'E', high: 'G', id: 'm3'},
  {low: 'A', high: 'C', id: 'm3'}, {low: 'B', high: 'D', id: 'm3'},
  // 大三度 M3（4）
  {low: 'C', high: 'E', id: 'M3'}, {low: 'F', high: 'A', id: 'M3'}, {low: 'G', high: 'B', id: 'M3'},
  // 纯四度 P4（5）
  {low: 'C', high: 'F', id: 'P4'}, {low: 'D', high: 'G', id: 'P4'},
  {low: 'E', high: 'A', id: 'P4'}, {low: 'G', high: 'C', id: 'P4'},
  {low: 'A', high: 'D', id: 'P4'}, {low: 'B', high: 'E', id: 'P4'},
  // 增四度 A4（6）
  {low: 'F', high: 'B', id: 'A4'},
  // 减五度 d5（6）
  {low: 'B', high: 'F', id: 'd5'},
  // 纯五度 P5（7）
  {low: 'C', high: 'G', id: 'P5'}, {low: 'D', high: 'A', id: 'P5'},
  {low: 'E', high: 'B', id: 'P5'}, {low: 'F', high: 'C', id: 'P5'},
  {low: 'G', high: 'D', id: 'P5'}, {low: 'A', high: 'E', id: 'P5'},
  // 小六度 m6（8）
  {low: 'E', high: 'C', id: 'm6'}, {low: 'A', high: 'F', id: 'm6'}, {low: 'B', high: 'G', id: 'm6'},
  // 大六度 M6（9）
  {low: 'C', high: 'A', id: 'M6'}, {low: 'D', high: 'B', id: 'M6'},
  {low: 'F', high: 'D', id: 'M6'}, {low: 'G', high: 'E', id: 'M6'},
  // 小七度 m7（10）
  {low: 'D', high: 'C', id: 'm7'}, {low: 'E', high: 'D', id: 'm7'},
  {low: 'G', high: 'F', id: 'm7'}, {low: 'A', high: 'G', id: 'm7'}, {low: 'B', high: 'A', id: 'm7'},
  // 大七度 M7（11）
  {low: 'C', high: 'B', id: 'M7'}, {low: 'F', high: 'E', id: 'M7'},
  // 纯八度 P8（12）——用户要求不要这种同名音八度题，故不收入题库（P8 仍可作干扰项）
];

export function intervalQKey(q: IntervalQuestion): string {
  return `${q.low}-${q.high}`;
}

export function intervalById(id: string): IntervalType {
  return INTERVAL_TYPES.find((t) => t.id === id) ?? INTERVAL_TYPES[0];
}