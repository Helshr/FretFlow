// 音高检测（自相关）与吉他弦匹配

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 标准调弦 6 根弦（复用 lib/notes/notes.ts 的 OPEN_FREQ 数值）
export const GUITAR_STRINGS = [
  {string: 6, note: 'E', freq: 82.41},
  {string: 5, note: 'A', freq: 110.0},
  {string: 4, note: 'D', freq: 146.83},
  {string: 3, note: 'G', freq: 196.0},
  {string: 2, note: 'B', freq: 246.94},
  {string: 1, note: 'E', freq: 329.63},
];

export interface Detected {
  freq: number;
  midi: number;
  note: string; // 最近音名（含 #）
  cents: number; // 相对最近音名
  string: number; // 最近标准弦号 6..1
  stringNote: string;
  stringCents: number; // 相对最近标准弦
}

// 抛物线插值：取局部峰中心，返回频率
function interpolatePeak(lag: number, y0: number, y1: number, y2: number, sampleRate: number): number {
  const a = (y0 + y2) / 2 - y1;
  const b = (y2 - y0) / 2;
  const correction = a !== 0 ? -b / (2 * a) : 0;
  return sampleRate / (lag + correction);
}

// 自相关基频检测（aubio 风格：|a−b| 相关，取第一个强局部峰锁定基频，避免八度误差）；静音返回 -1
export function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);

  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  const MIN_FREQ = 80;
  const MAX_FREQ = 1200;
  const START = Math.max(1, Math.floor(sampleRate / MAX_FREQ));
  const END = Math.min(MAX_SAMPLES, Math.floor(sampleRate / MIN_FREQ));

  // 相关数组（长度 +2，便于取前后邻居做插值）
  const len = END - START + 1;
  const corr = new Float32Array(len + 2);
  for (let lag = START; lag <= END; lag++) {
    let c = 0;
    for (let i = 0; i < MAX_SAMPLES; i++) c += Math.abs(buf[i] - buf[i + lag]);
    corr[lag - START + 1] = 1 - c / MAX_SAMPLES;
  }

  let globalBestIdx = 1;
  let globalBestVal = 0;
  for (let i = 1; i <= len; i++) {
    const v = corr[i];
    if (v > globalBestVal) {
      globalBestVal = v;
      globalBestIdx = i;
    }
    // 第一个强局部峰 → 基频
    if (v > 0.8 && v >= corr[i - 1] && v > corr[i + 1]) {
      const lag = START + i - 1;
      return interpolatePeak(lag, corr[i - 1], v, corr[i + 1], sampleRate);
    }
  }
  if (globalBestVal > 0.1) {
    const lag = START + globalBestIdx - 1;
    return interpolatePeak(
      lag,
      corr[globalBestIdx - 1],
      globalBestVal,
      corr[globalBestIdx + 1],
      sampleRate,
    );
  }
  return -1;
}

export function freqToDetected(freq: number): Detected {
  const midi = 69 + 12 * Math.log2(freq / 440);
  const nearestMidi = Math.round(midi);
  const note = NOTE_NAMES[((nearestMidi % 12) + 12) % 12];
  const cents = (midi - nearestMidi) * 100;

  let bestStr = GUITAR_STRINGS[0];
  let bestDiff = Infinity;
  for (const s of GUITAR_STRINGS) {
    const diff = Math.abs(1200 * Math.log2(freq / s.freq));
    if (diff < bestDiff) {
      bestDiff = diff;
      bestStr = s;
    }
  }

  return {
    freq,
    midi,
    note,
    cents,
    string: bestStr.string,
    stringNote: bestStr.note,
    stringCents: 1200 * Math.log2(freq / bestStr.freq),
  };
}
