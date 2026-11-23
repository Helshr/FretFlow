// C 大调七自然音 × 七自然音的上行音程对照表（行 = 起点，列 = 终点，「上行」指从终点在高八度）。
// 首行 C、首列 C，行列顺序都对应 C_MAJOR_NOTES（C D E F G A B）。
// 用户提供的 7×7 表；B → F 按用户「注意」与标准乐理记作减五度（d5，而非表格里误写的增四）。
import type {IntervalId} from './cmajor';

export type TableCell = IntervalId | 'P1'; // P1=纯一度（同名，仅对角）

export const INTERVAL_TABLE: TableCell[][] = [
  //          C    D    E    F    G    A    B
  ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'], // 从 C
  ['m7', 'P1', 'M2', 'm3', 'P4', 'P5', 'M6'], // 从 D
  ['m6', 'm7', 'P1', 'm2', 'm3', 'P4', 'P5'], // 从 E
  ['P5', 'M6', 'M7', 'P1', 'M2', 'M3', 'A4'], // 从 F（F→B 增四）
  ['P4', 'P5', 'M6', 'm7', 'P1', 'M2', 'M3'], // 从 G
  ['m3', 'P4', 'P5', 'm6', 'm7', 'P1', 'M2'], // 从 A
  ['m2', 'm3', 'P4', 'd5', 'm6', 'm7', 'P1'], // 从 B（B→F 减五）
];