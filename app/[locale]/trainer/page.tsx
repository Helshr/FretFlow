'use client';

import {useTranslations} from 'next-intl';
import {useTrainingSession} from '@/hooks/useTrainingSession';
import FeaturePage from '@/components/FeaturePage';
import SettingsForm from '@/components/SettingsForm';
import TrainingView from '@/components/TrainingView';

export default function TrainerPage() {
  const t = useTranslations();
  const session = useTrainingSession();
  const modeLabel = session.mode === 'open' ? 'Open Chords' : 'CAGED';

  return (
    <FeaturePage homeLabel={t('nav.home')} title={t('app.title')}>
      <p className="mb-6 text-center text-sm text-muted">{t('app.subtitle')}</p>

      {session.phase === 'settings' ? (
        <SettingsForm onStart={session.start} />
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
