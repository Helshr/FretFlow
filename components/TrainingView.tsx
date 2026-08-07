'use client';

import {useTranslations} from 'next-intl';
import {chordDisplay} from '@/lib/chords/display';
import type {PoolItem} from '@/lib/chords/types';
import ChordDiagram from './ChordDiagram';

export default function TrainingView({
  modeLabel,
  pool,
  current,
  next,
  timeText,
  paused,
  measureBeats,
  progress,
  measuresPerChord,
  onPause,
  onStop,
}: {
  modeLabel: string;
  pool: PoolItem[];
  current: PoolItem | null;
  next: PoolItem | null;
  timeText: string;
  paused: boolean;
  measureBeats: number;
  progress: number;
  measuresPerChord: number;
  onPause: () => void;
  onStop: () => void;
}) {
  const t = useTranslations();
  const labels = {
    major: t('chord.majorSuffix'),
    shape: t('chord.shapeSuffix'),
    power: t('chord.power'),
  };
  const currentD = current ? chordDisplay(current, labels) : null;
  const nextD = next ? chordDisplay(next, labels) : null;
  const beatsPerChord = measuresPerChord * 4;

  return (
    <div className="flex flex-col items-center gap-8 pt-4">
      {/* 环形计时器 */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-[100px] w-[100px]">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#2a2a2a" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#e8a850"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 * progress}
              style={{transition: 'stroke-dashoffset 0.2s linear'}}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[1.375rem] font-bold tabular-nums">
            {timeText}
          </div>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">
          {t('train.remaining')}
        </span>
      </div>

      {/* 当前和弦 */}
      <div className="text-center">
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">
          {t('train.current')}
        </div>
        <div className="animate-pulse text-[5rem] font-black leading-none tracking-[-0.02em] text-[#e8a850] [text-shadow:0_0_60px_rgba(232,168,80,0.3)] max-md:text-[3.5rem]">
          {currentD?.name}
        </div>
        <div className="mt-1 text-sm font-semibold text-[#a0a0a0]">{currentD?.shape}</div>
      </div>

      {/* 和弦指法图 */}
      {currentD && <ChordDiagram {...currentD} className="mx-auto w-[220px]" />}

      {/* 小节节拍点 */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-3">
          {Array.from({length: beatsPerChord}).map((_, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 transition-all ${
                i < measureBeats
                  ? 'border-[#e8a850] bg-[#e8a850] [box-shadow:0_0_12px_rgba(232,168,80,0.3)]'
                  : i === measureBeats
                    ? 'animate-[beat_0.6s_ease-in-out_infinite] border-[#e8a850]'
                    : 'border-[#2a2a2a]'
              }`}
            />
          ))}
        </div>
        <span className="text-[0.75rem] uppercase tracking-[0.06em] text-[#6b6b6b]">
          {t('settings.measures')}
        </span>
      </div>

      {/* 下一和弦 */}
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#1c1c1c] px-8 py-3 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6b6b6b]">
          {t('train.next')}
        </div>
        <div className="text-xl font-bold text-[#a0a0a0]">{nextD?.name}</div>
      </div>

      {/* 和弦流 */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {pool.map((c, i) => {
          const isCurrent = current ? c.key === current.key : false;
          return (
            <span key={i} className="flex items-center gap-3">
              {i > 0 && <span className="text-xs text-[#6b6b6b]">→</span>}
              <span
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                  isCurrent
                    ? 'border-[#e8a850] bg-[#e8a850] text-[#0a0a0a] [box-shadow:0_0_16px_rgba(232,168,80,0.3)]'
                    : 'border-[#2a2a2a] text-[#a0a0a0]'
                }`}
              >
                {chordDisplay(c, labels).name}
              </span>
            </span>
          );
        })}
      </div>

      <div className="text-sm text-[#6b6b6b]">{modeLabel}</div>

      {/* 控制 */}
      <div className="flex gap-3">
        <button
          onClick={onPause}
          className="inline-flex items-center gap-2 rounded-full border-[1.5px] px-7 py-3 text-base font-bold cursor-pointer transition-all font-[inherit]"
          style={{
            borderColor: paused ? '#e8a850' : '#2a2a2a',
            color: paused ? '#e8a850' : '#f5f5f5',
            background: paused ? 'transparent' : '#1c1c1c',
          }}
        >
          {paused ? t('train.resume') : t('train.pause')}
        </button>
        <button
          onClick={onStop}
          className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#fb7185] bg-transparent px-7 py-3 text-base font-bold text-[#fb7185] cursor-pointer transition-all hover:bg-[rgba(251,113,133,0.08)] font-[inherit]"
        >
          {t('train.stop')}
        </button>
      </div>
    </div>
  );
}
