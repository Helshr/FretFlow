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
