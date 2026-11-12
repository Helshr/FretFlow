// /scales 21 品指板的共享几何（查看指形视图与找音练习视图共用）。
// 弦序从上到下为 1→6（六线谱习惯）；其他页面（/notes /find-note）仍用 lib/fretboard 的 12 品 6-top。
import {MAX_SCALE_FRET} from './aug';

export const FRETS = MAX_SCALE_FRET;
export const X0 = 40; // 琴枕 x
export const FRET_W = 36; // 每品宽
export const TOP = 44; // 1 弦 y
export const SGAP = 22; // 弦间距
export const VIEW_H = 205;
export const FRET_LABEL_Y = 192;
export const STRING_LABEL_X = X0 - 14;
export const LAST_X = X0 + FRETS * FRET_W;
export const VIEW_W = LAST_X + 96;

// 标准品记点位：3/5/7/9、15/17/19 单点，12 双点
export const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19];
export const DOUBLE_INLAYS = [12];
export const INLAY_FILL = '#5b6470';

// 弦号 → y 坐标（1 在顶部）
export function stringY(s: number): number {
  return TOP + (s - 1) * SGAP;
}

// 有品的音位于品格中间；空弦（0 品）在琴枕处
export function fretX(fret: number): number {
  return fret === 0 ? X0 : X0 + (fret - 0.5) * FRET_W;
}

export const INLAY_Y = (TOP + stringY(6)) / 2;