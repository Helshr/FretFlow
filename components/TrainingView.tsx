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
  playChord,
  measureBeats,
  progress,
  measuresPerChord,
  onPause,
  onToggleChord,
  onStop,
}: {
  modeLabel: string;
  pool: PoolItem[];
  current: PoolItem | null;
  next: PoolItem | null;
  timeText: string;
  paused: boolean;
  playChord: boolean;
  measureBeats: number;
  progress: number;
  measuresPerChord: number;
  onPause: () => void;
  onToggleChord: () => void;
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
    <div className="flex flex-col items-center gap-3 pt-2">
      {/* 全部练习和弦（自适应网格，最多 6 个/排，位于最上方） */}
      <div className="flex w-full max-w-[560px] flex-col gap-1.5">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">
          {t('train.allChords')}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {pool.map((c, i) => {
            const d = chordDisplay(c, labels);
            const isCurrent = current ? c.key === current.key : false;
            return (
              <div
                key={i}
                className={`flex flex-col items-center rounded-xl border px-1 pb-1 pt-1.5 text-center ${
                  isCurrent
                    ? 'border-[#e8a850] bg-[#e8a850]/10 [box-shadow:0_0_16px_rgba(232,168,80,0.2)]'
                    : 'border-[#2a2a2a] bg-[#141414]'
                }`}
              >
                <div
                  className={`mb-1 truncate text-xs font-semibold ${
                    isCurrent ? 'text-[#e8a850]' : 'text-[#a0a0a0]'
                  }`}
                >
                  {d.name}
                </div>
                <ChordDiagram {...d} className="w-full" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 环形计时器 */}
      <div className="flex flex-col items-center gap-1">
        <div className="relative h-[68px] w-[68px]">
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
          <div className="absolute inset-0 flex items-center justify-center text-base font-bold tabular-nums">
            {timeText}
          </div>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">
          {t('train.remaining')}
        </span>
      </div>

      {/* 当前 / 下一和弦并排 */}
      <div className="grid w-full max-w-[560px] grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col items-center rounded-2xl border border-[#e8a850]/50 bg-[#1c1c1c] px-5 py-2.5 text-center [box-shadow:0_0_24px_rgba(232,168,80,0.12)]">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">
            {t('train.current')}
          </div>
          <div className="animate-pulse text-4xl font-extrabold leading-tight tracking-[-0.02em] text-[#e8a850] [text-shadow:0_0_60px_rgba(232,168,80,0.3)] max-md:text-3xl">
            {currentD?.name}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-[#a0a0a0]">{currentD?.shape}</div>
          {currentD && <ChordDiagram {...currentD} className="mx-auto mt-1.5 w-[120px]" />}
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-[#2a2a2a] bg-[#141414] px-5 py-2.5 text-center opacity-80">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">
            {t('train.next')}
          </div>
          <div className="text-xl font-bold leading-tight text-[#a0a0a0]">{nextD?.name}</div>
          <div className="mt-0.5 text-xs font-semibold text-[#6b6b6b]">{nextD?.shape}</div>
          {nextD && <ChordDiagram {...nextD} className="mx-auto mt-1.5 w-[88px] opacity-80" />}
        </div>
      </div>

      {/* 小节节拍点 */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex gap-2">
          {Array.from({length: beatsPerChord}).map((_, i) => (
            <div
              key={i}
              className={`h-3.5 w-3.5 rounded-full border-2 transition-all ${
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

      <div className="text-sm text-[#6b6b6b]">{modeLabel}</div>

      {/* 控制 */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-[#2a2a2a] bg-[#1c1c1c] px-4 py-2 text-sm font-bold font-[inherit]">
          <span className={playChord ? 'text-[#e8a850]' : 'text-[#a0a0a0]'}>{t('train.chordSound')}</span>
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={playChord}
            onChange={() => onToggleChord()}
          />
        </label>
        <button
          onClick={onPause}
          className="inline-flex items-center gap-2 rounded-full border-[1.5px] px-6 py-2 text-sm font-bold cursor-pointer transition-all font-[inherit]"
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
          className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#fb7185] bg-transparent px-6 py-2 text-sm font-bold text-[#fb7185] cursor-pointer transition-all hover:bg-[rgba(251,113,133,0.08)] font-[inherit]"
        >
          {t('train.stop')}
        </button>
      </div>
    </div>
  );
}
