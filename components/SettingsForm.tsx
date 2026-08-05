'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import type {Settings} from '@/lib/chords/types';
import {DRUM_PATTERNS} from '@/lib/drum/drumMachine';

function RadioGroup<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: {value: T; label: string}[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="mb-4 rounded-xl border border-line px-4 py-3">
      <legend className="px-2 text-sm text-muted">{legend}</legend>
      {options.map((o) => (
        <label key={String(o.value)} className="mr-4 inline-block cursor-pointer text-base">
          <input
            type="radio"
            name={name}
            className="mr-2 accent-accent"
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}

function SliderRow({
  id,
  label,
  min,
  max,
  value,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-2 block">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-7 flex-1 accent-accent"
        />
        <span className="min-w-8 rounded-lg bg-card-2 px-2 py-1 text-center text-lg font-bold tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}

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
  const [patternId, setPatternId] = useState('rock');

  function submit() {
    onStart({mode, chordCount, bpm, measuresPerChord, durationMin, patternId});
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <RadioGroup
        legend={t('mode')}
        name="mode"
        value={mode}
        onChange={setMode}
        options={[
          {value: 'open' as const, label: t('modeOpen')},
          {value: 'caged' as const, label: t('modeCaged')},
        ]}
      />

      <SliderRow id="chord-count" label={t('chordCount')} min={2} max={12} value={chordCount} onChange={setChordCount} />
      <SliderRow id="bpm" label={t('bpm')} min={40} max={180} value={bpm} onChange={setBpm} />

      <RadioGroup
        legend={t('pattern')}
        name="pattern"
        value={patternId}
        onChange={setPatternId}
        options={DRUM_PATTERNS.map((p) => ({
          value: p.id,
          label: p.id[0].toUpperCase() + p.id.slice(1),
        }))}
      />

      <RadioGroup
        legend={t('measures')}
        name="measures"
        value={measuresPerChord}
        onChange={setMeasuresPerChord}
        options={([1, 2, 4] as const).map((v) => ({value: v, label: t(`measures${v}`)}))}
      />

      <RadioGroup
        legend={t('time')}
        name="duration"
        value={durationMin}
        onChange={setDurationMin}
        options={([1, 3, 5, 10] as const).map((v) => ({value: v, label: t(`minutes${v}`)}))}
      />

      <button
        onClick={submit}
        className="mt-1 w-full rounded-xl bg-accent py-3 text-lg font-bold text-white hover:brightness-110"
      >
        {t('start')}
      </button>
    </div>
  );
}
