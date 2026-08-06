'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {
  CHROMATIC_NOTES,
  NATURAL_NOTES,
  NOTE_SEMITONE,
  notePositions,
  speakNote,
  tonePlayer,
} from '@/lib/notes/notes';

export type NoteScope = '7' | '12';
export type NoteStatus = 'idle' | 'playing' | 'ready';

const FIRST_DELAY_MS = 2000; // 念字母（~0.4s）+ 停顿 1.5s 后再开始播放音序
const DEFAULT_INTERVAL_MS = 2000; // 每个音的时间间隔（默认）

export function useNotePlayer() {
  const [scope, setScope] = useState<NoteScope>('7');
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [status, setStatus] = useState<NoteStatus>('idle');
  const [currentPos, setCurrentPos] = useState<{string: number; fret: number} | null>(null);
  const [auto, setAuto] = useState(false);
  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL_MS);

  const timeoutsRef = useRef<number[]>([]);
  const currentNoteRef = useRef<string | null>(null);

  useEffect(() => {
    currentNoteRef.current = currentNote;
  }, [currentNote]);

  const pool = scope === '7' ? NATURAL_NOTES : CHROMATIC_NOTES;

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, ms));
  }, []);

  const playNote = useCallback(
    (note: string) => {
      clearTimers();
      setStatus('playing');
      speakNote(note);
      const positions = notePositions(NOTE_SEMITONE[note]);
      // 音长随间隔自适应，避免间隔过短时音叠加
      const durSec = Math.max(0.1, Math.min(0.4, intervalMs / 1000 - 0.15));
      let t = FIRST_DELAY_MS;
      positions.forEach((p) => {
        schedule(() => {
          tonePlayer.play(p.freq, durSec);
          setCurrentPos({string: p.string, fret: p.fret});
        }, t);
        t += intervalMs;
      });
      schedule(() => {
        setStatus('ready');
        setCurrentPos(null);
      }, t);
    },
    [clearTimers, schedule, intervalMs],
  );

  const pickNext = useCallback(
    (exclude: string | null): string => {
      const candidates = pool.filter((n) => n !== exclude);
      return candidates[Math.floor(Math.random() * candidates.length)];
    },
    [pool],
  );

  const start = useCallback(() => {
    const note = pickNext(null);
    setCurrentNote(note);
    playNote(note);
  }, [pickNext, playNote]);

  const nextNote = useCallback(() => {
    const note = pickNext(currentNoteRef.current);
    setCurrentNote(note);
    playNote(note);
  }, [pickNext, playNote]);

  const repeat = useCallback(() => {
    if (currentNoteRef.current) playNote(currentNoteRef.current);
  }, [playNote]);

  // 自动模式：一组播完自动接下一个
  useEffect(() => {
    if (auto && status === 'ready') {
      const id = window.setTimeout(() => nextNote(), 700);
      return () => window.clearTimeout(id);
    }
  }, [auto, status, nextNote]);

  // 卸载清理：清定时器 + 停止语音
  useEffect(() => {
    return () => {
      clearTimers();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearTimers]);

  function changeScope(s: NoteScope) {
    setScope(s);
    setCurrentNote(null);
    setStatus('idle');
    setCurrentPos(null);
    clearTimers();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // 停止当前播放并回到初始状态
  const stop = useCallback(() => {
    clearTimers();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentNote(null);
    setStatus('idle');
    setCurrentPos(null);
  }, [clearTimers]);

  const playing = status === 'playing';
  const positions = currentNote ? notePositions(NOTE_SEMITONE[currentNote]) : [];

  return {
    scope,
    currentNote,
    status,
    currentPos,
    auto,
    intervalMs,
    positions,
    playing,
    changeScope,
    setAuto,
    setIntervalMs,
    start,
    nextNote,
    repeat,
    stop,
  };
}
