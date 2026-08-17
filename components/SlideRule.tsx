'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {
  FIFTHS_ORDER,
  noteLabel,
  CHORD_TYPES,
  chordTones,
} from '@/lib/slideRule/theory';
import type {ChordCategory, PitchClass} from '@/lib/slideRule/theory';

const CATEGORIES: {id: ChordCategory; labelKey: string}[] = [
  {id: 'triads', labelKey: 'catTriads'},
  {id: 'sevenths', labelKey: 'catSevenths'},
  {id: 'sixths', labelKey: 'catSixths'},
  {id: 'suspended', labelKey: 'catSuspended'},
  {id: 'extended', labelKey: 'catExtended'},
];

function SectionLabel({children}: {children: React.ReactNode}) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">
      {children}
      <span className="h-px flex-1 bg-[#2a2a2a]" />
    </div>
  );
}

export default function SlideRule() {
  const t = useTranslations('slideRule');
  const [root, setRoot] = useState<PitchClass>(9); // 默认 A

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-2">
      {/* 根音选择（五度圈） */}
      <div className="flex flex-col gap-2">
        <SectionLabel>{t('root')}</SectionLabel>
        <div className="flex flex-wrap justify-center gap-1.5">
          {FIFTHS_ORDER.map((pc) => {
            const label = noteLabel(pc);
            const active = pc === root;
            return (
              <button
                key={pc}
                onClick={() => setRoot(pc)}
                className={`flex h-10 w-[54px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border transition-all font-[inherit] ${
                  active
                    ? 'border-[#e8a850] bg-[#e8a850] text-[#0a0a0a] [box-shadow:0_0_16px_rgba(232,168,80,0.3)]'
                    : 'border-[#2a2a2a] bg-[#141414] text-[#a0a0a0] hover:border-[#e8a850]/60 hover:text-[#e8a850]'
                }`}
              >
                <span className="text-[0.95rem] font-bold leading-none">{label.main}</span>
                {label.alt && (
                  <span className="text-[0.95rem] font-bold leading-none">{label.alt}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 按分类分区展示（一屏无滚动） */}
      <div className="flex flex-col gap-1.5">
        {CATEGORIES.map((cat) => {
          const chords = CHORD_TYPES.filter((ct) => ct.category === cat.id);
          return (
            <div key={cat.id} className="flex flex-col gap-1">
              <SectionLabel>{t(cat.labelKey)}</SectionLabel>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                {chords.map((ct) => {
                  const tones = chordTones(root, ct);
                  return (
                    <div
                      key={ct.id}
                      className="flex flex-col items-center rounded-xl border border-[#2a2a2a] bg-[#141414] px-1 py-1 text-center"
                    >
                      <div className="text-[0.8rem] font-bold leading-tight text-[#a0a0a0]">
                        {t(`chordTypes.${ct.id}`)}
                      </div>
                      <div className="mt-0.5 flex flex-wrap justify-center gap-1">
                        {tones.map((pc, i) => {
                          const nl = noteLabel(pc);
                          return (
                            <span
                              key={i}
                              className="flex h-7 min-w-[20px] flex-col items-center justify-center rounded-md border border-[#e8a850]/40 bg-[#1c1c1c] px-0.5 py-0 text-center leading-none"
                            >
                              <span className="text-[0.68rem] font-bold tabular-nums text-[#e8a850]">
                                {nl.main}
                              </span>
                              {nl.alt && (
                                <span className="text-[0.68rem] font-bold tabular-nums text-[#e8a850]">
                                  {nl.alt}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
