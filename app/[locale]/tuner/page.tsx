import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import FeaturePage from '@/components/FeaturePage';
import Tuner from '@/components/Tuner';
import TunerSeo from '@/components/TunerSeo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale});
  // 西班牙语 SEO 关键词页面使用专属描述，其余语言沿用首页卡片文案
  const desc = locale === 'es' ? t('tuner.metaDescription') : t('home.tunerDesc');
  return pageMetadata(t('tuner.title'), desc, '/tuner', locale);
}

export default async function TunerPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <FeaturePage homeLabel={t('nav.home')} title={t('tuner.title')}>
      <Tuner />
      {locale === 'es' && <TunerSeo locale={locale} />}
    </FeaturePage>
  );
}
