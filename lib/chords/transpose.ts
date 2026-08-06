import {OPEN_FREQ} from '../guitar';
import type {
  CagedShape,
  OpenChord,
  PoolItem,
  Quality,
  Settings,
  TransposedChord,
} from './types';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 空弦音（吉他弦号 6..1 → 半音，C=0）
export const OPEN_STRING_NOTE: Record<number, number> = { 6: 4, 5: 9, 4: 2, 3: 7, 2: 11, 1: 4 };

export const QUALITIES: Quality[] = ['Major', 'Minor', 'm7', 'Maj7', '7', '5'];

export function randInt(n: number): number {
  return Math.floor(Math.random() * n);
}

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

// 保证所有非闷音绝对品位 ∈ [1,12] 的 rootFret 范围
export function rootFretRange(shape: CagedShape): { lo: number; hi: number } | null {
  let lo = 1;
  let hi = 12;
  for (const v of shape.template) {
    if (v === -1) continue;
    lo = Math.max(lo, 1 - v);
    hi = Math.min(hi, 12 - v);
  }
  return lo <= hi ? { lo, hi } : null;
}

export function transposeShape(shape: CagedShape, rootFret: number): TransposedChord {
  const frets = shape.template.map((v) => (v === -1 ? -1 : v + rootFret));
  const note = (OPEN_STRING_NOTE[shape.rootString] + rootFret) % 12;
  return {
    chord: NOTE_NAMES[note],
    quality: shape.quality,
    shape: shape.id,
    rootString: shape.rootString,
    rootFret,
    frets,
    barre: shape.barre ?? null,
    key: `${NOTE_NAMES[note]}|${shape.quality}|${shape.id}|${rootFret}`,
  };
}

export function makePool(
  settings: Settings,
  openData: { chords: OpenChord[] },
  cagedData: { shapes: CagedShape[] },
): PoolItem[] {
  if (settings.mode === 'open') {
    return shuffle(openData.chords.slice()).slice(0, settings.chordCount).map((c) => ({
      ...c,
      key: c.name,
    }));
  }

  // 限定某指形家族（如 'E' → E/Em/E7/Em7/Emaj7/E5）
  const shapePool =
    settings.shapeFilter === 'all'
      ? cagedData.shapes
      : cagedData.shapes.filter((s) => s.id.startsWith(settings.shapeFilter));

  const seen = new Set<string>();
  const pool: PoolItem[] = [];
  let guard = 0;
  while (pool.length < settings.chordCount && guard++ < 500) {
    const quality = QUALITIES[randInt(QUALITIES.length)];
    const candidates = shapePool.filter((s) => s.quality === quality);
    if (candidates.length === 0) continue;
    const shape = candidates[randInt(candidates.length)];
    const range = rootFretRange(shape);
    if (!range) continue;
    const rootFret = range.lo + randInt(range.hi - range.lo + 1);
    const c = transposeShape(shape, rootFret);
    if (seen.has(c.key)) continue;
    seen.add(c.key);
    pool.push(c);
  }
  return pool;
}

export function pickNext(pool: PoolItem[], current: PoolItem): PoolItem {
  const others = pool.filter((c) => c.key !== current.key);
  if (others.length === 0) return current;
  return others[randInt(others.length)];
}

// 和弦各非闷音弦的实际音高（6→1 弦顺序），用于播放和弦音
export function chordFrequencies(c: {frets: number[]}): number[] {
  const out: number[] = [];
  c.frets.forEach((fret, i) => {
    if (fret < 0) return;
    const string = 6 - i;
    out.push(OPEN_FREQ[string] * Math.pow(2, fret / 12));
  });
  return out;
}
