// AUG（Absolutely Understand Guitar）Lesson 7 三种大调音阶指形练习数据。
// 三种指形覆盖全部 1–6 弦的标准把位形状（非官方指形图逐点转录，正式发布前需对照教材核对，
// 尤其 Pattern B 的低音侧与各形状的 6/7 品伸展细节）。移调见 patternRoute。

// 指板满品数：21 品保证每个调的指形都能落在 0–MAX 品内的自然低八度区，12 个调全部可展示。
export const MAX_SCALE_FRET = 21;

import {CHROMATIC_NOTES, OPEN_SEMITONE} from '../notes/notes';

export interface ScaleEntry {
  string: number; // 6..1
  fret: number; // 品（移调后可为 0=空弦）
  finger: number; // 左手手指 1..4
  degree: number; // 音级 1..8（8=高八度根音）
}

export interface AugPattern {
  id: 'a' | 'b' | 'c';
  nameKey: string; // i18n 相对键（useTranslations('scales') 下）：patternName.*
  tagKey: string; // i18n 相对键：patternTag.*
  detailKey: string; // i18n 相对键：patternDetail.*
  baseTonic: number; // 示例调主音半音（C=0）
  notes: ScaleEntry[];
  reach?: {noteIndex: number};
}

function e(string: number, fret: number, finger: number, degree: number): ScaleEntry {
  return {string, fret, finger, degree};
}

export const AUG_PATTERNS: AugPattern[] = [
  {
    id: 'a',
    nameKey: 'patternName.a',
    tagKey: 'patternTag.a',
    detailKey: 'patternDetail.a',
    baseTonic: 7, // G
    // 全把位形状（根音 6 弦·中指）：按你给的八度路线延伸至全部 6 弦，标把位 2-5（2 弦 7 品为小指伸展）
    notes: [
      e(6, 3, 2, 1),
      e(6, 5, 4, 2),
      e(5, 2, 1, 3),
      e(5, 3, 2, 4),
      e(5, 5, 4, 5),
      e(4, 2, 1, 6),
      e(4, 4, 3, 7),
      e(4, 5, 4, 1),
      e(3, 2, 1, 2),
      e(3, 4, 3, 3),
      e(3, 5, 4, 4),
      e(2, 3, 2, 5),
      e(2, 5, 4, 6),
      e(2, 7, 4, 7),
      e(1, 3, 2, 1),
      e(1, 5, 4, 2),
    ],
  },
  {
    id: 'b',
    nameKey: 'patternName.b',
    tagKey: 'patternTag.b',
    detailKey: 'patternDetail.b',
    baseTonic: 2, // D
    // 全把位形状（根音 5 弦·小指）：按你给的八度路线延伸至全部 6 弦，标把位 2-6
    notes: [
      e(6, 4, 3, 3),
      e(6, 5, 4, 4),
      e(5, 5, 4, 1),
      e(4, 2, 1, 2),
      e(4, 4, 3, 3),
      e(4, 5, 4, 4),
      e(3, 2, 1, 5),
      e(3, 4, 3, 6),
      e(3, 6, 4, 7),
      e(2, 2, 1, 7),
      e(2, 3, 2, 1),
      e(2, 5, 4, 2),
      e(1, 2, 1, 3),
      e(1, 3, 2, 4),
      e(1, 5, 4, 5),
    ],
  },
  {
    id: 'c',
    nameKey: 'patternName.c',
    tagKey: 'patternTag.c',
    detailKey: 'patternDetail.c',
    baseTonic: 9, // A
    // 全把位形状（根音 6 弦·小指）：按你给的八度路线延伸至全部 6 弦；第 7 音（4 弦 6 品）小指伸展
    notes: [
      e(6, 5, 4, 1),
      e(5, 2, 1, 2),
      e(5, 4, 3, 3),
      e(5, 5, 4, 4),
      e(4, 2, 1, 5),
      e(4, 4, 3, 6),
      e(4, 6, 4, 7),
      e(3, 2, 1, 1),
      e(3, 4, 3, 2),
      e(2, 2, 1, 3),
      e(2, 3, 2, 4),
      e(2, 5, 4, 5),
      e(1, 2, 1, 6),
      e(1, 4, 3, 7),
      e(1, 5, 4, 1),
    ],
    reach: {noteIndex: 6},
  },
];

// 指形移调：琴弦与左手手指保持不变，只平移品位。
// 返回该指形在 0–MAX 品内**所有可放置的八度**（低→高合并），
// 例如 Pattern A × F# 大调在低八度（根音 2 品）与高八度（根音 14 品）都能放下，
// 两个位置都返回，让「找到 1」时把全部位置的 1 都选出来。
export function patternRoute(p: AugPattern, tonic: number): ScaleEntry[] | null {
  const base = (((tonic - p.baseTonic) % 12) + 12) % 12;
  const offsets: number[] = [];
  for (const octave of [-24, -12, 0, 12, 24]) {
    const off = base + octave;
    if (p.notes.every((n) => n.fret + off >= 0 && n.fret + off <= MAX_SCALE_FRET)) {
      offsets.push(off);
    }
  }
  const out: ScaleEntry[] = [];
  for (const off of offsets.sort((a, b) => a - b)) {
    for (const n of p.notes) out.push({...n, fret: n.fret + off});
  }
  return out.length > 0 ? out : null;
}

// 指定位置在 12 音名里的名字（不带八度，如 "F#"）
export function entryName(e: ScaleEntry): string {
  return posName(e.string, e.fret);
}

export function posName(string: number, fret: number): string {
  const semi = ((OPEN_SEMITONE[string] + fret) % 12 + 12) % 12;
  return CHROMATIC_NOTES[semi];
}