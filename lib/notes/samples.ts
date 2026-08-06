// 吉他采样数据（tonejs-instrument-guitar-acoustic-wav，CC-BY 3.0，经 jsDelivr CDN 按需加载）

export const SAMPLE_BASE_URL =
  'https://cdn.jsdelivr.net/npm/tonejs-instrument-guitar-acoustic-wav@1.1.0/';
export const SAMPLE_GAIN = 0.8; // 单音音量
export const CHORD_GAIN = 0.5; // 和弦单音音量（多音同奏防削波）

// 半音采样表（MIDI 音符号 → 包内文件名），E2..D5 按序
export const SAMPLES: {midi: number; file: string}[] = [
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

export const SAMPLE_COUNT = SAMPLES.length;

export const CACHE_NAME = 'guitar-samples-v1';

// 频率 → 最近采样 + playbackRate（≤1 半音，失真极小）
export function nearestSample(midi: number): {file: string; playbackRate: number} {
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
