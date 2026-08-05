'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import type {Settings} from '@/lib/chords/types';

export default function SettingsForm({
  onStart,
}: {
  onStart: (settings: Settings) => void;
}) {
  const t = useTranslations('settings');
  const [mode, setMode] = useState<'open' | 'caged'>('open');
  const [chordCount, setChordCount] = useState(4);
  const [bpm, setBpm] = useState(80);
  const [measuresPerChord, setMeasuresPerChord] = useState<1 | 2 | 4>(1);
  const [durationMin, setDurationMin] = useState(5);

  function submit() {
    onStart({mode, chordCount, bpm, measuresPerChord, durationMin});
  }

  const radioInput =
    'mr-2 accent-accent';
  const fieldset =
    'mb-4 rounded-xl border border-line px-4 py-3';
  const legend =
    'px-2 text-sm text-muted';
  const radioLabel =
    'mr-4 inline-block cursor-pointer text-base';

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <fieldset className={fieldset}>
        <legend className={legend}>{t('mode')}</legend>
        <label className={radioLabel}>
          <input
            type="radio"
            name="mode"
            className={radioInput}
            checked={mode === 'open'}
            onChange={() => setMode('open')}
          />
          {t('modeOpen')}
        </label>
        <label className={radioLabel}>
          <input
            type="radio"
            name="mode"
            className={radioInput}
            checked={mode === 'caged'}
            onChange={() => setMode('caged')}
          />
          {t('modeCaged')}
        </label>
      </fieldset>

      <div className="mb-5">
        <label htmlFor="chord-count" className="mb-2 block">
          {t('chordCount')}
        </label>
        <div className="flex items-center gap-3">
          <input
            id="chord-count"
            type="range"
            min={2}
            max={12}
            value={chordCount}
            onChange={(e) => setChordCount(Number(e.target.value))}
            className="h-7 flex-1 accent-accent"
          />
          <span className="min-w-8 rounded-lg bg-card-2 px-2 py-1 text-center text-lg font-bold tabular-nums">
            {chordCount}
          </span>
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="bpm" className="mb-2 block">
          {t('bpm')}
        </label>
        <div className="flex items-center gap-3">
          <input
            id="bpm"
            type="range"
            min={40}
            max={180}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="h-7 flex-1 accent-accent"
          />
          <span className="min-w-8 rounded-lg bg-card-2 px-2 py-1 text-center text-lg font-bold tabular-nums">
            {bpm}
          </span>
        </div>
      </div>

      <fieldset className={fieldset}>
        <legend className={legend}>{t('measures')}</legend>
        {([1, 2, 4] as const).map((v) => (
          <label key={v} className={radioLabel}>
            <input
              type="radio"
              name="measures"
              className={radioInput}
              checked={measuresPerChord === v}
              onChange={() => setMeasuresPerChord(v)}
            />
            {t(`measures${v}`)}
          </label>
        ))}
      </fieldset>

      <fieldset className={fieldset}>
        <legend className={legend}>{t('time')}</legend>
        {([1, 3, 5, 10] as const).map((v) => (
          <label key={v} className={radioLabel}>
            <input
              type="radio"
              name="duration"
              className={radioInput}
              checked={durationMin === v}
              onChange={() => setDurationMin(v)}
            />
            {t(`minutes${v}`)}
          </label>
        ))}
      </fieldset>

      <button
        onClick={submit}
        className="mt-1 w-full rounded-xl bg-accent py-3 text-lg font-bold text-white hover:brightness-110"
      >
        {t('start')}
      </button>
    </div>
  );
}
