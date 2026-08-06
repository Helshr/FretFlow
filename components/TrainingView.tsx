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
  done,
  onPause,
  onStop,
  onReturn,
}: {
  modeLabel: string;
  pool: PoolItem[];
  current: PoolItem | null;
  next: PoolItem | null;
  timeText: string;
  paused: boolean;
  done: boolean;
  onPause: () => void;
  onStop: () => void;
  onReturn: () => void;
}) {
  const t = useTranslations();
  const labels = {
    major: t('chord.majorSuffix'),
    shape: t('chord.shapeSuffix'),
    power: t('chord.power'),
  };
  const currentD = current ? chordDisplay(current, labels) : null;
  const nextD = next ? chordDisplay(next, labels) : null;

  // 当前和弦用绿色边框+发光突出（边框宽度与下一和弦一致，避免布局跳动），下一和弦弱化
  const currentCard =
    'rounded-2xl border border-accent-2 bg-accent-2/5 p-5 text-center shadow-[0_0_20px_rgba(46,204,113,0.12)]';
  const nextCard = 'rounded-2xl border border-line bg-card p-5 text-center opacity-75';
  const cardLabel = 'mb-1.5 text-sm text-muted';
  const chordName = 'mb-0.5 text-4xl font-extrabold leading-tight';
  const chordShape = 'mb-1.5 min-h-[1.4em] text-base text-accent-2';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-muted">{modeLabel}</span>
        <button
          onClick={onStop}
          className="rounded-xl border border-line bg-card-2 px-6 py-3 text-base text-accent hover:brightness-110"
        >
          {t('train.stop')}
        </button>
      </div>

      {pool.length > 1 && (
        <div className="mb-4">
          <div className="mb-2 text-sm text-muted">{t('train.allChords')}</div>
          <div className="flex flex-wrap justify-center gap-2">
            {pool.map((c, i) => {
              const d = chordDisplay(c, labels);
              const isCurrent = current ? c.key === current.key : false;
              return (
                <div
                  key={i}
                  className={`w-20 rounded-xl border p-2 text-center ${
                    isCurrent
                      ? 'border-accent-2 bg-accent-2/10'
                      : 'border-line bg-card opacity-60'
                  }`}
                >
                  <div className="truncate text-xs font-semibold">{d.name}</div>
                  <ChordDiagram {...d} className="mx-auto w-[52px]" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={currentCard}>
          <div className={cardLabel}>{t('train.current')}</div>
          <div className={chordName}>{currentD?.name}</div>
          <div className={chordShape}>{currentD?.shape}</div>
          {currentD && <ChordDiagram {...currentD} />}
        </div>
        <div className={nextCard}>
          <div className={cardLabel}>{t('train.next')}</div>
          <div className={chordName}>{nextD?.name}</div>
          <div className={chordShape}>{nextD?.shape}</div>
          {nextD && <ChordDiagram {...nextD} />}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card p-5 text-center">
        <div className={cardLabel}>{t('train.remaining')}</div>
        <div className="my-1 text-4xl font-extrabold tabular-nums">
          {timeText}
        </div>
      </div>

      {!done && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={onPause}
            className="rounded-xl border border-line bg-card-2 px-8 py-3 text-base hover:brightness-110"
          >
            {paused ? t('train.resume') : t('train.pause')}
          </button>
        </div>
      )}

      {done && (
        <div className="mt-5 rounded-2xl border border-accent-2 bg-accent-2/10 p-5 text-center">
          <div className="mb-3.5 text-2xl font-extrabold text-accent-2">
            {t('train.done')}
          </div>
          <button
            onClick={onReturn}
            className="w-full rounded-xl bg-accent py-3 text-lg font-bold text-white hover:brightness-110"
          >
            {t('train.return')}
          </button>
        </div>
      )}
    </div>
  );
}
