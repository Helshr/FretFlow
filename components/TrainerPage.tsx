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
      <div className="mx-auto max-w-[900px] px-6 py-4 pb-6">
        {/* 顶部栏 */}
        <div className="mb-3 flex items-center justify-between">
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
            {/* 练习记录（笔记本风格） */}
            <div className="mb-2 overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#141414]">
              <div className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#1c1c1c] px-4 py-1.5">
                <span className="flex items-center gap-1.5 text-[0.8rem] font-bold text-[#f5f5f5]">
                  <NotebookIcon />
                  {t('practice.record')}
                </span>
                <span className="rounded-full border border-[#e8a850]/40 bg-[#e8a850]/10 px-2.5 py-0.5 text-xs font-semibold text-[#e8a850]">
                  {t('practice.streak', {n: session.practiceStats.currentStreak})}
                </span>
              </div>
              <div className="px-4 py-1.5 text-[0.8rem] leading-[20px] [background:repeating-linear-gradient(transparent,transparent_19px,rgba(255,255,255,0.05)_19px,rgba(255,255,255,0.05)_20px)]">
                {session.practiceRecent.length > 0 ? (
                  session.practiceRecent.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex items-baseline justify-between">
                      <span className="tabular-nums text-[#6b6b6b]">
                        {r.date.slice(5).replace('-', '/')}
                      </span>
                      <span className="tabular-nums font-medium text-[#e8a850]">
                        {t('practice.entry', {
                          duration: r.durationMin,
                          bpm: r.bpm,
                          switches: r.switchCount,
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-1 py-2 text-center">
                    <NotebookIcon className="text-[#3a3e46]" />
                    <span className="text-[#6b6b6b]">{t('practice.empty')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3 text-center">
              <h1 className="text-xl font-bold tracking-[-0.01em]">{t('app.title')}</h1>
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
            playChord={session.playChord}
            measureBeats={session.measureBeats}
            progress={session.progress}
            measuresPerChord={session.measuresPerChord}
            onPause={session.togglePause}
            onToggleChord={session.togglePlayChord}
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
              <StatCard value={session.practiceStats.currentStreak} label={t('practice.streakLabel')} />
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

function NotebookIcon({className = ''}: {className?: string}) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 6h6M5 9h6M5 12h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
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
