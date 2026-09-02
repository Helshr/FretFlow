// 用户偏好持久化（localStorage）

const PLAY_CHORD_KEY = 'fretflow-play-chord';

export function loadPlayChord(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(PLAY_CHORD_KEY) !== '0';
  } catch {
    return true;
  }
}

export function savePlayChord(v: boolean): void {
  try {
    localStorage.setItem(PLAY_CHORD_KEY, v ? '1' : '0');
  } catch {
    /* localStorage 不可用时忽略 */
  }
}

const REFERENCE_PITCH_KEY = 'fretflow-reference-pitch';

export function loadReferencePitch(): number {
  if (typeof window === 'undefined') return 440;
  try {
    const v = Number(localStorage.getItem(REFERENCE_PITCH_KEY));
    return v === 432 ? 432 : 440;
  } catch {
    return 440;
  }
}

export function saveReferencePitch(v: number): void {
  try {
    localStorage.setItem(REFERENCE_PITCH_KEY, String(v));
  } catch {
    /* localStorage 不可用时忽略 */
  }
}
