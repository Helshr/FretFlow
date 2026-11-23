import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import {INTERVAL_IDS} from '@/lib/intervals/cmajor';
import FeaturePage from '@/components/FeaturePage';
import IntervalGame from '@/components/IntervalGame';
import IntervalTable from '@/components/IntervalTable';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale});
  return pageMetadata(t('intervals.title'), t('home.intervalsDesc'), '/intervals', locale);
}

export default async function IntervalsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  // 对照表格子用的本地化音程名（含对角 P1）
  const intervalNames: Record<string, string> = {P1: t('intervals.P1')};
  for (const id of INTERVAL_IDS) intervalNames[id] = t(`intervals.${id}`);

  return (
    <FeaturePage homeLabel={t('nav.home')} title={t('intervals.title')} exclude="/intervals">
      <IntervalTable label={t('intervals.intervalTable')} names={intervalNames} />
      <IntervalGame />
    </FeaturePage>
  );
}