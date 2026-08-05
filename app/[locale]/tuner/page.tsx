'use client';

import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import PageHeader from '@/components/PageHeader';
import Tuner from '@/components/Tuner';

export default function TunerPage() {
  const t = useTranslations();

  return (
    <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-6">
      <PageHeader
        left={
          <Link href="/" className="rounded-lg border border-line bg-card-2 px-3 py-1.5 text-muted hover:text-text">
            {t('nav.home')}
          </Link>
        }
      />
      <h1 className="mb-8 text-center text-2xl font-bold">{t('tuner.title')}</h1>
      <Tuner />
    </main>
  );
}
