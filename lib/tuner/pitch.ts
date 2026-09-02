// 音高检测（自相关）与吉他弦匹配

import {GUITAR_STRINGS} from '../guitar';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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

  // 相关数组（长度 +2：首尾各留一位给边界比较，避免扫描时把未初始化的 0 误判为局部峰）
  const len = END - START + 1;
  const corr = new Float32Array(len + 2);
  for (let lag = START - 1; lag <= END + 1; lag++) {
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

// referenceA：A4 参考频率（440 或 432 Hz 等），各弦目标音与音分偏差随之缩放
export function freqToDetected(freq: number, referenceA = 440): Detected {
  const midi = 69 + 12 * Math.log2(freq / referenceA);
  const nearestMidi = Math.round(midi);
  const note = NOTE_NAMES[((nearestMidi % 12) + 12) % 12];
  const cents = (midi - nearestMidi) * 100;

  let bestStr = GUITAR_STRINGS[0];
  let bestDiff = Infinity;
  for (const s of GUITAR_STRINGS) {
    const targetFreq = (s.freq * referenceA) / 440;
    const diff = Math.abs(1200 * Math.log2(freq / targetFreq));
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
    stringCents: 1200 * Math.log2(freq / ((bestStr.freq * referenceA) / 440)),
  };
}
