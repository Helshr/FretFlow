'use client';

import {useTranslations} from 'next-intl';
import {noteNameAt} from '@/lib/notes/notes';
import {useNotePlayer} from '@/hooks/useNotePlayer';
import type {NoteScope} from '@/hooks/useNotePlayer';
import {useGuitarSamples} from '@/hooks/useGuitarSamples';
import Fretboard from './Fretboard';

export default function NoteTrainer() {
  const t = useTranslations('notes');
  const {ready, loaded, total, failed} = useGuitarSamples();
  const {
    scope,
    currentNote,
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
  } = useNotePlayer();

  const posLabel = currentPos
    ? `${noteNameAt(currentPos.string, currentPos.fret)} · ${t('stringX', {
        n: currentPos.string,
      })} ${currentPos.fret === 0 ? t('open') : t('fretX', {n: currentPos.fret})}`
    : '';

  const scopeBtn = (active: boolean) =>
    `rounded-xl px-4 py-2 text-sm font-semibold transition ${
      active
        ? 'bg-accent text-[#0a0a0a]'
        : 'border border-line bg-card-2 text-muted hover:text-text'
    }`;
  const ctrlBtn = (primary = false, disabled = false) =>
    `min-h-12 rounded-xl px-8 py-3 text-base font-semibold transition ${
      disabled
        ? 'cursor-not-allowed opacity-40'
        : primary
          ? 'bg-accent text-[#0a0a0a] hover:brightness-110'
          : 'border border-line bg-card-2 hover:brightness-110'
    }`;

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-6">
        <Fretboard positions={positions} active={currentPos} label={currentNote ?? undefined} />
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {(['7', '12'] as NoteScope[]).map((s) => (
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
          {playing ? `${t('playing')} ${posLabel}` : currentNote ? t('ready') : ''}
        </div>
      </div>

      {!ready && (
        <div className="mb-3 text-center text-sm text-muted">
          {t('loadingSamples', {n: Math.round((loaded / total) * 100)})}
        </div>
      )}
      {failed && (
        <div className="mb-3 text-center text-sm text-accent">{t('sampleFailed')}</div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {!currentNote ? (
          <button onClick={start} disabled={!ready} className={ctrlBtn(true, !ready)}>
            {t('start')}
          </button>
        ) : (
          <>
            <button onClick={stop} className={ctrlBtn(false)}>
              {t('stop')}
            </button>
            <button onClick={nextNote} disabled={playing} className={ctrlBtn(true, playing)}>
              {t('next')}
            </button>
            <button onClick={repeat} disabled={playing} className={ctrlBtn(false, playing)}>
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
