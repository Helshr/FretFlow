'use client';

import {useTranslations} from 'next-intl';
import FeaturePage from '@/components/FeaturePage';
import Tuner from '@/components/Tuner';

export default function TunerPage() {
  const t = useTranslations();

  return (
    <FeaturePage homeLabel={t('nav.home')} title={t('tuner.title')}>
      <Tuner />
    </FeaturePage>
  );
}
