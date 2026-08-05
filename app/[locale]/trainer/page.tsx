'use client';

import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {useTrainingSession} from '@/hooks/useTrainingSession';
import PageHeader from '@/components/PageHeader';
import SettingsForm from '@/components/SettingsForm';
import TrainingView from '@/components/TrainingView';

export default function TrainerPage() {
  const t = useTranslations();
  const session = useTrainingSession();
  const modeLabel = session.mode === 'open' ? 'Open Chords' : 'CAGED';

  return (
    <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-6">
      <PageHeader
        left={
          <Link href="/" className="rounded-lg border border-line bg-card-2 px-3 py-1.5 text-muted hover:text-text">
            {t('nav.home')}
          </Link>
        }
      />
      <h1 className="text-center text-2xl font-bold">{t('app.title')}</h1>
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
    </main>
  );
}
