// 音乐滑尺：音阶/音级/顺阶和弦/进行 纯逻辑

export type PitchClass = number; // 0=C 1=C# … 11=B

export type Quality = 'major' | 'minor' | 'dim' | 'aug';

export type ScaleFamilyId = 'majorDiatonic' | 'harmonicMinor';

export interface ScaleFamily {
  id: ScaleFamilyId;
  labelKey: string; // i18n key（slideRule.family*）
}

export interface ScaleType {
  id: string;
  name: string; // 拉丁名（Ionian 等），各语言通用
  family: ScaleFamilyId;
  intervals: number[]; // 相对主音的半音
}

export const SCALE_FAMILIES: ScaleFamily[] = [
  {id: 'majorDiatonic', labelKey: 'familyMajor'},
  {id: 'harmonicMinor', labelKey: 'familyHarmonicMinor'},
];

export interface DegreeChord {
  degree: string; // I / ii / iii / IV / V / vi / vii°
  pc: PitchClass;
  note: string; // 主音名（升号拼写）
  chord: string; // C / Cm / Cdim / C+
  quality: Quality;
  isTonic: boolean;
}

// 白键音级 → 音名
const WHITE: Record<PitchClass, string> = {
  0: 'C',
  2: 'D',
  4: 'E',
  5: 'F',
  7: 'G',
  9: 'A',
  11: 'B',
};

// 黑键音级 → 双拼写（升号/降号）
const ENHARMONIC: Record<PitchClass, {sharp: string; flat: string}> = {
  1: {sharp: 'C#', flat: 'Db'},
  3: {sharp: 'D#', flat: 'Eb'},
  6: {sharp: 'F#', flat: 'Gb'},
  8: {sharp: 'G#', flat: 'Ab'},
  10: {sharp: 'A#', flat: 'Bb'},
};

export function isBlackKey(pc: PitchClass): boolean {
  return pc in ENHARMONIC;
}

// 展示用：白键单字母，黑键 {main:'G#', alt:'Ab'}
export function noteLabel(pc: PitchClass): {main: string; alt: string | null} {
  const e = ENHARMONIC[pc];
  return e ? {main: e.sharp, alt: e.flat} : {main: WHITE[pc], alt: null};
}


// 和弦根音用升号拼写
export function pcSharpName(pc: PitchClass): string {
  const e = ENHARMONIC[pc];
  return e ? e.sharp : WHITE[pc];
}

// 五度圈顺序（音级）——C G D A E B F# C# G# D# A# F
export const FIFTHS_ORDER: PitchClass[] = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

export const SCALE_TYPES: ScaleType[] = [
  // Major Diatonic Modes（同组大调音阶，从不同音级起始）
  {id: 'ionian', name: 'Ionian', family: 'majorDiatonic', intervals: [0, 2, 4, 5, 7, 9, 11]},
  {id: 'dorian', name: 'Dorian', family: 'majorDiatonic', intervals: [0, 2, 3, 5, 7, 9, 10]},
  {id: 'phrygian', name: 'Phrygian', family: 'majorDiatonic', intervals: [0, 1, 3, 5, 7, 8, 10]},
  {id: 'lydian', name: 'Lydian', family: 'majorDiatonic', intervals: [0, 2, 4, 6, 7, 9, 11]},
  {id: 'mixolydian', name: 'Mixolydian', family: 'majorDiatonic', intervals: [0, 2, 4, 5, 7, 9, 10]},
  {id: 'aeolian', name: 'Aeolian', family: 'majorDiatonic', intervals: [0, 2, 3, 5, 7, 8, 10]},
  {id: 'locrian', name: 'Locrian', family: 'majorDiatonic', intervals: [0, 1, 3, 5, 6, 8, 10]},
  // Harmonic Minor Modes（和声小音阶的 7 个调式）
  {id: 'hmAeolian7', name: 'Aeolian ♯7', family: 'harmonicMinor', intervals: [0, 2, 3, 5, 7, 8, 11]},
  {id: 'hmLocrian6', name: 'Locrian ♯6', family: 'harmonicMinor', intervals: [0, 1, 3, 5, 6, 9, 10]},
  {id: 'hmIonian5', name: 'Ionian ♯5', family: 'harmonicMinor', intervals: [0, 2, 4, 5, 8, 9, 11]},
  {id: 'hmDorian4', name: 'Dorian ♯4', family: 'harmonicMinor', intervals: [0, 2, 3, 6, 7, 9, 10]},
  {id: 'hmPhrygianMajor', name: 'Phrygian Major', family: 'harmonicMinor', intervals: [0, 1, 4, 5, 7, 8, 10]},
  {id: 'hmLydian2', name: 'Lydian ♯2', family: 'harmonicMinor', intervals: [0, 3, 4, 6, 7, 9, 10]},
  {id: 'hmUltralocrian', name: 'Ultralocrian', family: 'harmonicMinor', intervals: [0, 1, 3, 4, 6, 8, 9]},
];

export function getScaleType(id: string): ScaleType {
  return SCALE_TYPES.find((s) => s.id === id) ?? SCALE_TYPES[0];
}

// 主音 + 音阶 → 7 个音级（半音，0–11）
export function scalePitchClasses(tonic: PitchClass, scale: ScaleType): PitchClass[] {
  return scale.intervals.map((i) => (tonic + i) % 12);
}

const ROMAN_BASE = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'];

function degreeLabel(quality: Quality, idx: number): string {
  const base = ROMAN_BASE[idx];
  if (quality === 'major') return base.toUpperCase();
  if (quality === 'dim') return base.toLowerCase() + '°';
  return base.toLowerCase();
}

function chordName(rootName: string, quality: Quality): string {
  if (quality === 'major') return rootName;
  if (quality === 'dim') return `${rootName}dim`;
  if (quality === 'aug') return `${rootName}+`;
  return `${rootName}m`;
}

function triadQuality(scale: PitchClass[], i: number): Quality {
  const root = scale[i];
  const third = (scale[(i + 2) % 7] - root + 12) % 12;
  const fifth = (scale[(i + 4) % 7] - root + 12) % 12;
  if (third === 4 && fifth === 7) return 'major';
  if (third === 3 && fifth === 7) return 'minor';
  if (third === 3 && fifth === 6) return 'dim';
  if (third === 4 && fifth === 8) return 'aug';
  return 'major';
}

// 主音 + 音阶 → 7 个顺阶和弦（含音级/音名/和弦名/性质）
export function diatonicChords(tonic: PitchClass, scale: ScaleType): DegreeChord[] {
  const pcs = scalePitchClasses(tonic, scale);
  return pcs.map((pc, i) => {
    const quality = triadQuality(pcs, i);
    return {
      degree: degreeLabel(quality, i),
      pc,
      note: pcSharpName(pc),
      chord: chordName(pcSharpName(pc), quality),
      quality,
      isTonic: i === 0,
    };
  });
}

const DEGREE_INDEX: Record<string, number> = {
  I: 0,
  II: 1,
  III: 2,
  IV: 3,
  V: 4,
  VI: 5,
  VII: 6,
};

// 常见进行（音阶级数序列）
export const PROGRESSIONS: string[][] = [
  ['I', 'V', 'vi', 'IV'],
  ['I', 'IV', 'V'],
  ['ii', 'V', 'I'],
  ['I', 'vi', 'IV', 'V'],
  ['vi', 'IV', 'I', 'V'],
  ['I', 'IV', 'vi', 'V'],
  ['i', 'VI', 'III', 'VII'],
  ['I', 'V', 'I'],
];

// 进行 → 该调下的实际和弦
export function transposeProgression(
  tonic: PitchClass,
  scale: ScaleType,
  degrees: string[],
): string[] {
  const chords = diatonicChords(tonic, scale);
  return degrees.map((d) => {
    const base = d.replace('°', '').toUpperCase();
    const idx = DEGREE_INDEX[base];
    if (idx === undefined) return d;
    return chords[idx].chord;
  });
}

// ── Chords and Arpeggios ──

export type ChordCategory = 'triads' | 'sevenths' | 'sixths' | 'suspended' | 'extended';

export interface ChordType {
  id: string;
  label: string; // 英文名（如 "Major Triad"）
  category: ChordCategory;
  intervals: number[]; // 相对根音的半音（1 ♭3 3 5 ♭5 ♭7 7 9 ♭9 #9 11 13）
}

export const CHORD_TYPES: ChordType[] = [
  // 三和弦
  {id: 'major', label: 'Major Triad', category: 'triads', intervals: [0, 4, 7]},
  {id: 'augmented', label: 'Augmented Triad', category: 'triads', intervals: [0, 4, 8]},
  {id: 'minor', label: 'Minor Triad', category: 'triads', intervals: [0, 3, 7]},
  {id: 'diminished', label: 'Diminished Triad', category: 'triads', intervals: [0, 3, 6]},
  // 七和弦
  {id: 'dominant7', label: 'Dominant 7', category: 'sevenths', intervals: [0, 4, 7, 10]},
  {id: 'major7', label: 'Major 7', category: 'sevenths', intervals: [0, 4, 7, 11]},
  {id: 'minor7', label: 'Minor 7', category: 'sevenths', intervals: [0, 3, 7, 10]},
  {id: 'dim7', label: 'Diminished 7', category: 'sevenths', intervals: [0, 3, 6, 9]},
  {id: 'minorMaj7', label: 'Minor Major 7', category: 'sevenths', intervals: [0, 3, 7, 11]},
  {id: 'halfDim7', label: 'Minor 7♭5', category: 'sevenths', intervals: [0, 3, 6, 10]},
  {id: 'sevenFlat5', label: '7♭5', category: 'sevenths', intervals: [0, 4, 6, 10]},
  {id: 'sevenSharp5', label: '7#5', category: 'sevenths', intervals: [0, 4, 8, 10]},
  {id: 'sevenSharp9', label: '7#9', category: 'sevenths', intervals: [0, 4, 7, 10, 3]},
  {id: 'sevenFlat9', label: '7♭9', category: 'sevenths', intervals: [0, 4, 7, 10, 1]},
  // 六和弦
  {id: 'six', label: 'Six', category: 'sixths', intervals: [0, 4, 7, 9]},
  {id: 'minorSix', label: 'Minor 6', category: 'sixths', intervals: [0, 3, 7, 9]},
  {id: 'sixAdd9', label: '6/9', category: 'sixths', intervals: [0, 4, 7, 9, 2]},
  // 挂留
  {id: 'sus4', label: 'Suspended 4', category: 'suspended', intervals: [0, 5, 7]},
  // 九 / 十一 / 十三
  {id: 'nine', label: 'Nine', category: 'extended', intervals: [0, 4, 7, 10, 2]},
  {id: 'minorNine', label: 'Minor 9', category: 'extended', intervals: [0, 3, 7, 10, 2]},
  {id: 'add9', label: 'Add 9', category: 'extended', intervals: [0, 4, 7, 2]},
  {id: 'eleven', label: 'Eleven', category: 'extended', intervals: [0, 4, 7, 10, 2, 5]},
  {id: 'thirteen', label: 'Thirteen', category: 'extended', intervals: [0, 4, 7, 10, 2, 5, 9]},
];

// 根音 + 和弦类型 → 组成音（音级，0–11）
export function chordTones(root: PitchClass, type: ChordType): PitchClass[] {
  return type.intervals.map((i) => (root + i) % 12);
}
