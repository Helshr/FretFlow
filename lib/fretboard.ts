// 指板 SVG 几何常量与坐标（6 弦在顶部，0–12 品）。Fretboard / ScaleFretboard / FindBoard 共用，保证同一视觉比例。

export const X0 = 40; // 琴枕 x
export const FRET_W = 52; // 每品宽
export const TOP = 44; // 6 弦 y
export const SGAP = 22; // 弦间距
export const FRETS = 12;
export const LAST_X = X0 + FRETS * FRET_W;
export const VIEW_W = 760;
export const VIEW_H = 205;

export const SINGLE_INLAY_FRETS = [3, 5, 7, 9];
export const DOUBLE_INLAY_FRETS = [12];

export const STRING_LABEL_X = X0 - 14;
export const FRET_LABEL_Y = 192;

// 弦号 → y 坐标（6=顶部最粗弦）
export function stringY(s: number): number {
  return TOP + (6 - s) * SGAP;
}

// 有品的音位于品格中间（第 f 品 = f-1 与 f 两条品线之间）；空弦（0 品）在琴枕处
export function fretX(fret: number): number {
  return fret === 0 ? X0 : X0 + (fret - 0.5) * FRET_W;
}

export const INLAY_Y = (TOP + stringY(1)) / 2; // 品镶点中心 y