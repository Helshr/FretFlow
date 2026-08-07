'use client';

import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {useTrainingSession} from '@/hooks/useTrainingSession';
import {useGuitarSamples} from '@/hooks/useGuitarSamples';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SettingsForm from '@/components/SettingsForm';
import TrainingView from '@/components/TrainingView';

export default function TrainerPage() {
  const t = useTranslations();
  const session = useTrainingSession();
  const {ready, loaded, total} = useGuitarSamples();
  const modeLabel =
    session.mode === 'open'
      ? 'Open Chords'
      : session.shapeFilter === 'all'
        ? 'CAGED'
        : `CAGED · ${session.shapeFilter}${t('chord.shapeSuffix')}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] antialiased">
      <div className="mx-auto max-w-[900px] px-6 py-5 pb-8">
        {/* 顶部栏 */}
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] px-4 py-2.5 text-sm font-semibold text-[#a0a0a0] transition-all hover:border-[#3d3d3d] hover:bg-[#1c1c1c] hover:text-[#f5f5f5]"
          >
            <ArrowLeft /> {t('nav.home')}
          </Link>
          <LanguageSwitcher className="border-[#2a2a2a] bg-[#1c1c1c] text-[#a0a0a0]" />
        </div>

        {session.phase === 'settings' && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold tracking-[-0.01em]">
                FretFlow · <span className="text-[#e8a850]">{t('app.title')}</span>
              </h1>
              <p className="mt-1 text-sm text-[#a0a0a0]">{t('app.subtitle')}</p>
            </div>
            <SettingsForm
              onStart={session.start}
              samplesReady={ready}
              samplesProgress={Math.round((loaded / total) * 100)}
            />
          </>
        )}

        {session.phase === 'countdown' && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
            <div
              key={session.countdown}
              className="animate-[pop_0.7s_cubic-bezier(0.34,1.56,0.64,1)] text-[8rem] font-black leading-none text-[#e8a850]"
            >
              {session.countdown}
            </div>
            <div className="text-lg uppercase tracking-[0.15em] text-[#a0a0a0]">
              {t('train.countdown')}
            </div>
          </div>
        )}

        {session.phase === 'training' && (
          <TrainingView
            modeLabel={modeLabel}
            pool={session.pool}
            current={session.current}
            next={session.next}
            timeText={session.timeText}
            paused={session.paused}
            measureBeats={session.measureBeats}
            progress={session.progress}
            measuresPerChord={session.measuresPerChord}
            onPause={session.togglePause}
            onStop={session.stop}
          />
        )}

        {session.phase === 'done' && (
          <div className="flex flex-col items-center gap-6 pt-10 text-center">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-bold">{t('train.done')}</h2>
            <div className="flex flex-wrap justify-center gap-6">
              <StatCard value={session.switchCount} label={t('train.allChords')} />
              <StatCard value={`${session.durationMin}:00`} label={t('settings.time')} />
              <StatCard value={session.bpm} label={t('settings.bpm')} />
            </div>
            <button
              onClick={session.stop}
              className="rounded-full border-0 bg-[#e8a850] px-8 py-3.5 text-lg font-bold text-[#0a0a0a] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(232,168,80,0.5)] font-[inherit] [box-shadow:0_4px_20px_rgba(232,168,80,0.3)]"
            >
              {t('train.return')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({value, label}: {value: string | number; label: string}) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] px-6 py-4 text-center">
      <div className="text-3xl font-bold text-[#e8a850]">{value}</div>
      <div className="mt-1 text-xs text-[#6b6b6b]">{label}</div>
    </div>
  );
}

function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M10 3L5 8l5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
