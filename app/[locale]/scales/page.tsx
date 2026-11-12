import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import FeaturePage from '@/components/FeaturePage';
import ScaleTrainer from '@/components/ScaleTrainer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale});
  return pageMetadata(t('scales.title'), t('home.scalesDesc'), '/scales', locale);
}

export default async function ScalesPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <FeaturePage homeLabel={t('nav.home')} title={t('scales.title')} exclude="/scales">
      <p className="mb-6 text-center text-sm text-muted">{t('scales.subtitle')}</p>
      <ScaleTrainer />
    </FeaturePage>
  );
}