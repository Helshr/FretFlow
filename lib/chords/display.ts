import type { ChordDisplay, PoolItem, Quality } from './types';

export interface DisplayLabels {
  major: string;
  shape: string;
  power: string;
}

// 和弦名后缀：Major 用全称（随语言变化），其余用通用符号
export function qualitySuffix(q: Quality, majorSuffix: string): string {
  if (q === 'Major') return ' ' + majorSuffix;
  if (q === 'Minor') return 'm';
  return q; // m7 / Maj7 / 7 / 5
}

export function chordDisplay(c: PoolItem, labels: DisplayLabels): ChordDisplay {
  if ('quality' in c) {
    return {
      name: c.chord + qualitySuffix(c.quality, labels.major),
      shape: c.quality === '5' ? labels.power : `${c.shape} ${labels.shape}`,
      frets: c.frets,
      rootString: c.rootString,
      barre: c.barre,
      rootFret: c.rootFret,
    };
  }
  return { name: c.name, shape: '', frets: c.frets, fingers: c.fingers };
}
