'use client';

import {useTranslations} from 'next-intl';
import {useTrainingSession} from '@/hooks/useTrainingSession';
import {useGuitarSamples} from '@/hooks/useGuitarSamples';
import FeaturePage from '@/components/FeaturePage';
import SettingsForm from '@/components/SettingsForm';
import TrainingView from '@/components/TrainingView';

export default function TrainerPage() {
  const t = useTranslations();
  const session = useTrainingSession();
  const {ready, loaded, total} = useGuitarSamples();
  const modeLabel = session.mode === 'open' ? 'Open Chords' : 'CAGED';

  return (
    <FeaturePage homeLabel={t('nav.home')} title={t('app.title')}>
      <p className="mb-6 text-center text-sm text-muted">{t('app.subtitle')}</p>

      {session.phase === 'countdown' ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-line bg-card p-8 text-center">
          <div className="mb-6 text-2xl font-bold text-accent">{t('train.countdown')}</div>
          <div className="text-[7rem] font-extrabold leading-none">{session.countdown}</div>
        </div>
      ) : session.phase === 'settings' ? (
        <SettingsForm
          onStart={session.start}
          samplesReady={ready}
          samplesProgress={Math.round((loaded / total) * 100)}
        />
      ) : (
        <TrainingView
          modeLabel={modeLabel}
          current={session.current}
          next={session.next}
          timeText={session.timeText}
          paused={session.paused}
          done={session.phase === 'done'}
          onPause={session.togglePause}
          onStop={session.stop}
          onReturn={session.stop}
        />
      )}
    </FeaturePage>
  );
}
