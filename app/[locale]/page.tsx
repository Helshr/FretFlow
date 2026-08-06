import {getTranslations, setRequestLocale} from 'next-intl/server';
import PageHeader from '@/components/PageHeader';
import FeatureCard from '@/components/FeatureCard';

export default async function HomePage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-6">
      <PageHeader left={<span className="font-bold text-muted">{t('title')}</span>} />

      <h1 className="mt-4 text-center text-3xl font-bold">{t('title')}</h1>
      <p className="mb-8 text-center text-muted">{t('subtitle')}</p>

      <div className="mb-3 text-sm text-muted">{t('section')}</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FeatureCard
          title={t('trainer')}
          desc={t('trainerDesc')}
          href="/trainer"
          cta={t('enter')}
        />
        <FeatureCard
          title={t('chordChart')}
          desc={t('chordChartDesc')}
          href="/chords"
          cta={t('enter')}
        />
        <FeatureCard
          title={t('notes')}
          desc={t('notesDesc')}
          href="/notes"
          cta={t('enter')}
        />
        <FeatureCard
          title={t('tuner')}
          desc={t('tunerDesc')}
          href="/tuner"
          cta={t('enter')}
        />
        <div className="rounded-2xl border border-line bg-card p-5 opacity-50">
          <div className="text-xl font-bold">{t('comingSoon')}</div>
        </div>
      </div>

      <footer className="mt-10 text-center text-xs text-muted/70">
        Guitar samples by{' '}
        <a
          href="https://github.com/tonejs/tonejs-instruments"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-muted"
        >
          Tone.js Instruments
        </a>{' '}
        (CC BY 3.0)
      </footer>
    </main>
  );
}
