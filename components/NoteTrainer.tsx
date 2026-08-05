'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {
  CHROMATIC_NOTES,
  NATURAL_NOTES,
  NOTE_SEMITONE,
  notePositions,
  speakNote,
  tonePlayer,
} from '@/lib/notes/notes';
import Fretboard from './Fretboard';

type Scope = '7' | '12';
type Status = 'idle' | 'playing' | 'ready';

const FIRST_DELAY_MS = 350; // 念完字母后的首个音延迟
const DEFAULT_INTERVAL_MS = 700; // 每个音的时间间隔（默认）

export default function NoteTrainer() {
  const t = useTranslations('notes');
  const [scope, setScope] = useState<Scope>('7');
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
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

  const nextNote = useCallback(() => {
    const note = pickNext(currentNoteRef.current);
    setCurrentNote(note);
    playNote(note);
  }, [pickNext, playNote]);

  const start = useCallback(() => {
    const note = pickNext(null);
    setCurrentNote(note);
    playNote(note);
  }, [pickNext, playNote]);

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

  function changeScope(s: Scope) {
    setScope(s);
    setCurrentNote(null);
    setStatus('idle');
    setCurrentPos(null);
    clearTimers();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  const playing = status === 'playing';
  const positions = currentNote ? notePositions(NOTE_SEMITONE[currentNote]) : [];
  const posLabel = currentPos
    ? `${t('stringX', {n: currentPos.string})} ${
        currentPos.fret === 0 ? t('open') : t('fretX', {n: currentPos.fret})
      }`
    : '';

  const scopeBtn = (active: boolean) =>
    `rounded-xl px-4 py-2 text-sm font-semibold transition ${
      active
        ? 'bg-accent text-white'
        : 'border border-line bg-card-2 text-muted hover:text-text'
    }`;
  const ctrlBtn = (primary = false, disabled = false) =>
    `min-h-12 rounded-xl px-8 py-3 text-base font-semibold transition ${
      disabled
        ? 'cursor-not-allowed opacity-40'
        : primary
          ? 'bg-accent text-white hover:brightness-110'
          : 'border border-line bg-card-2 hover:brightness-110'
    }`;

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-6">
        <Fretboard positions={positions} active={currentPos} label={currentNote ?? undefined} />
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {(['7', '12'] as Scope[]).map((s) => (
          <button
            key={s}
            onClick={() => changeScope(s)}
            className={scopeBtn(scope === s)}
          >
            {s === '7' ? t('scope7') : t('scope12')}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-center gap-2">
        <label htmlFor="note-interval" className="text-sm text-muted">
          {t('interval')}
        </label>
        <input
          id="note-interval"
          type="number"
          min={0.3}
          max={5}
          step={0.1}
          value={Math.round((intervalMs / 1000) * 10) / 10}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v) && v >= 0.3 && v <= 5) {
              setIntervalMs(Math.round(v * 1000));
            }
          }}
          className="w-20 rounded-lg border border-line bg-card-2 px-2 py-1.5 text-center text-sm text-text"
        />
        <span className="text-sm text-muted">{t('seconds')}</span>
      </div>

      <div className="rounded-2xl border border-line bg-card p-8 text-center">
        <div className="mb-4 text-sm text-muted">{t('instruction')}</div>
        <div className="text-[5rem] font-extrabold leading-none">
          {currentNote ?? ''}
        </div>
        <div className="mt-4 flex h-7 items-center justify-center text-base text-accent-2">
          {playing ? `${t('playing')} ${posLabel}` : status === 'ready' ? t('ready') : ''}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {!currentNote ? (
          <button onClick={start} className={ctrlBtn(true)}>
            {t('start')}
          </button>
        ) : (
          <>
            <button onClick={nextNote} disabled={playing} className={ctrlBtn(true, playing)}>
              {t('next')}
            </button>
            <button onClick={() => playNote(currentNote)} disabled={playing} className={ctrlBtn(false, playing)}>
              {t('repeat')}
            </button>
          </>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          {t('auto')}
        </label>
      </div>
    </div>
  );
}
