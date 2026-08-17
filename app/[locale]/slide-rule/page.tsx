'use client';

import {useTranslations} from 'next-intl';
import FeaturePage from '@/components/FeaturePage';
import SlideRule from '@/components/SlideRule';

export default function SlideRulePage() {
  const t = useTranslations();

  return (
    <FeaturePage homeLabel={t('nav.home')} title={t('slideRule.title')} maxWidth="max-w-[1080px]">
      <SlideRule />
    </FeaturePage>
  );
}
