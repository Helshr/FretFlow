import type { CagedShape, TransposedChord } from './types';
import { NOTE_NAMES, OPEN_STRING_NOTE, rootFretRange, transposeShape } from './transpose';

// 根音名称 → 半音（C=0）
const ROOT_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
};

export interface ShapeRootCell {
  root: string;
  chord: TransposedChord;
}

// 对每个形状，列出它在合法把位内能产生的 12 个根音（无法产生的为 null）
export function enumerateShapeRoots(shape: CagedShape): (ShapeRootCell | null)[] {
  return NOTE_NAMES.map((root) => {
    const target = ROOT_SEMITONE[root];
    const range = rootFretRange(shape);
    if (!range) return null;
    for (let R = range.lo; R <= range.hi; R++) {
      if ((OPEN_STRING_NOTE[shape.rootString] + R) % 12 === target) {
        return { root, chord: transposeShape(shape, R) };
      }
    }
    return null;
  });
}
