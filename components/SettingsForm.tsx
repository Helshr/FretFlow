'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import type {Settings, ShapeFilter} from '@/lib/chords/types';
import {DRUM_PATTERNS} from '@/lib/drum/drumMachine';

export default function SettingsForm({
  onStart,
  samplesReady = true,
  samplesProgress = 100,
}: {
  onStart: (settings: Settings) => void;
  samplesReady?: boolean;
  samplesProgress?: number;
}) {
  const t = useTranslations('settings');
  const [mode, setMode] = useState<'open' | 'caged'>('open');
  const [shapeFilter, setShapeFilter] = useState<ShapeFilter>('all');
  const [chordCount, setChordCount] = useState(4);
  const [bpm, setBpm] = useState(80);
  const [measuresPerChord, setMeasuresPerChord] = useState<1 | 2 | 4>(1);
  const [durationMin, setDurationMin] = useState(5);
  const [patternId, setPatternId] = useState('rock');
  const [playChord, setPlayChord] = useState(true);

  function submit() {
    onStart({
      mode,
      shapeFilter,
      chordCount,
      bpm,
      measuresPerChord,
      durationMin,
      patternId,
      playChord,
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-[24px] border border-[#2a2a2a] bg-[#141414] p-4">
      <SettingSection label={t('mode')}>
        <PillGroup
          options={[
            {v: 'open' as const, l: t('modeOpen')},
            {v: 'caged' as const, l: t('modeCaged')},
          ]}
          value={mode}
          onChange={setMode}
        />
      </SettingSection>

      {mode === 'caged' && (
        <SettingSection label={t('shape')}>
          <ChipGroup
            options={[
              {v: 'all', l: t('shapeAll')},
              {v: 'C', l: 'C'},
              {v: 'A', l: 'A'},
              {v: 'G', l: 'G'},
              {v: 'E', l: 'E'},
              {v: 'D', l: 'D'},
            ]}
            value={shapeFilter}
            onChange={setShapeFilter}
          />
        </SettingSection>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <SettingSection label={t('chordCount')}>
          <GoldSlider value={chordCount} min={2} max={18} onChange={setChordCount} />
        </SettingSection>

        <SettingSection label={t('bpm')}>
          <GoldSlider value={bpm} min={40} max={180} onChange={setBpm} />
        </SettingSection>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SettingSection label={t('pattern')}>
          <ChipGroup
            options={DRUM_PATTERNS.map((p) => ({
              v: p.id,
              l: p.id === 'metronome' ? t('metronome') : p.id[0].toUpperCase() + p.id.slice(1),
            }))}
            value={patternId}
            onChange={setPatternId}
          />
        </SettingSection>

        <SettingSection label={t('measures')}>
          <ChipGroup
            options={([1, 2, 4] as const).map((v) => ({v: String(v), l: t(`measures${v}`)}))}
            value={String(measuresPerChord)}
            onChange={(v) => setMeasuresPerChord(Number(v) as 1 | 2 | 4)}
          />
        </SettingSection>
      </div>

      <SettingSection label={t('time')}>
        <div className="grid grid-cols-4 gap-2 max-[600px]:grid-cols-2">
          {[1, 3, 5, 10].map((d) => (
            <button
              key={d}
              className={`rounded-xl border-[1.5px] px-3 py-1.5 text-center transition-all hover:border-[#e8a850] font-[inherit] cursor-pointer ${
                durationMin === d
                  ? 'border-[#e8a850] bg-[rgba(232,168,80,0.08)] text-[#e8a850]'
                  : 'border-[#2a2a2a] bg-transparent text-[#a0a0a0]'
              }`}
              onClick={() => setDurationMin(d)}
            >
              <span className="block text-base font-bold">{d}</span>
              <span className={`text-xs ${durationMin === d ? 'text-[#e8a850]' : 'text-[#6b6b6b]'}`}>
                {t(`minutes${d}`)}
              </span>
            </button>
          ))}
        </div>
      </SettingSection>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-[#1c1c1c] px-4 py-2">
        <span className="min-w-0 text-[0.9375rem] font-medium text-[#a0a0a0]">{t('playChord')}</span>
        <Toggle on={playChord} onChange={setPlayChord} />
      </div>

      {!samplesReady && (
        <p className="text-center text-sm text-[#a0a0a0]">{t('loadingSamples', {n: samplesProgress})}</p>
      )}

      <button
        onClick={submit}
        disabled={!samplesReady}
        className="w-full rounded-2xl border-0 bg-[linear-gradient(135deg,#e8a850,#d49430)] py-2.5 text-lg font-bold text-[#0a0a0a] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(232,168,80,0.5)] disabled:cursor-not-allowed disabled:opacity-40 [box-shadow:0_4px_24px_rgba(232,168,80,0.3)]"
      >
        {t('start')}
      </button>
    </div>
  );
}

/* ── 小组件 ── */

function SettingSection({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">
        {label}
        <span className="h-px flex-1 bg-[#2a2a2a]" />
      </div>
      {children}
    </div>
  );
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: {v: T; l: string}[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex w-fit gap-0.5 rounded-full border border-[#2a2a2a] bg-[#1c1c1c] p-[3px]">
      {options.map((o) => (
        <button
          key={o.v}
          className={`rounded-full border-0 px-[22px] py-1.5 text-[0.9375rem] font-semibold cursor-pointer transition-all font-[inherit] ${
            o.v === value
              ? 'bg-[#e8a850] text-[#0a0a0a] [box-shadow:0_2px_12px_rgba(232,168,80,0.3)]'
              : 'bg-transparent text-[#a0a0a0]'
          }`}
          onClick={() => onChange(o.v)}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: {v: T; l: string}[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.v}
          className={`rounded-full border-[1.5px] px-5 py-1.5 text-[0.9375rem] font-semibold cursor-pointer transition-all font-[inherit] ${
            o.v === value
              ? 'border-[#e8a850] bg-[#e8a850] text-[#0a0a0a] [box-shadow:0_2px_12px_rgba(232,168,80,0.3)]'
              : 'border-[#2a2a2a] bg-transparent text-[#a0a0a0] hover:border-[#e8a850] hover:text-[#e8a850]'
          }`}
          onClick={() => onChange(o.v)}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function GoldSlider({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded bg-[#2a2a2a] [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e8a850] [&::-webkit-slider-thumb]:[box-shadow:0_0_16px_rgba(232,168,80,0.3)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 hover:[&::-webkit-slider-thumb]:scale-[1.15]"
      />
      <div className="min-w-[56px] rounded-xl border border-[#2a2a2a] bg-[#1c1c1c] px-3 py-1.5 text-center text-lg font-bold tabular-nums text-[#e8a850]">
        {value}
      </div>
    </div>
  );
}

function Toggle({on, onChange}: {on: boolean; onChange: (v: boolean) => void}) {
  return (
    <input
      type="checkbox"
      className="toggle shrink-0"
      checked={on}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}
