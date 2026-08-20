'use client';

import {useCallback, useSyncExternalStore} from 'react';

export interface PracticeRecord {
  date: string; // YYYY-MM-DD
  durationMin: number;
  bpm: number;
  switchCount: number;
  mode: string;
}

export interface PracticeStats {
  totalSessions: number;
  totalSwitches: number;
  currentStreak: number;
  bestStreak: number;
}

const KEY = 'fretflow-practice-log';
const MAX_RECORDS = 200;

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function todayStr(): string {
  return iso(new Date());
}

function load(): PracticeRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

// 缓存快照，避免每次 getSnapshot 返回新引用导致无限重渲染
let cache: PracticeRecord[] | null = null;
function getSnapshot(): PracticeRecord[] {
  if (cache === null) cache = load();
  return cache;
}
function subscribe(cb: () => void): () => void {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

function currentStreak(days: Set<string>): number {
  if (days.size === 0) return 0;
  const d = new Date(`${todayStr()}T00:00:00`);
  if (!days.has(todayStr())) {
    d.setDate(d.getDate() - 1);
    if (!days.has(iso(d))) return 0;
  }
  let streak = 0;
  while (days.has(iso(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function bestStreak(days: string[]): number {
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of [...days].sort()) {
    if (prev) {
      const p = new Date(`${prev}T00:00:00`);
      const c = new Date(`${day}T00:00:00`);
      run = (c.getTime() - p.getTime()) / 86400000 === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

function computeStats(records: PracticeRecord[]): PracticeStats {
  const days = [...new Set(records.map((r) => r.date))];
  return {
    totalSessions: records.length,
    totalSwitches: records.reduce((s, r) => s + r.switchCount, 0),
    currentStreak: currentStreak(new Set(days)),
    bestStreak: bestStreak(days),
  };
}

export function usePracticeLog() {
  const records = useSyncExternalStore(subscribe, getSnapshot, () => []);
  const stats = computeStats(records);

  const logSession = useCallback((rec: Omit<PracticeRecord, 'date'>) => {
    const record: PracticeRecord = {...rec, date: todayStr()};
    const next = [...load(), record].slice(-MAX_RECORDS);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* localStorage 不可用时静默忽略 */
    }
    cache = next;
    window.dispatchEvent(new Event('storage'));
  }, []);

  return {stats, logSession};
}
