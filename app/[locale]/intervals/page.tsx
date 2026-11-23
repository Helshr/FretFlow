import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import {C_MAJOR_NOTES} from '@/lib/intervals/cmajor';
import FeaturePage from '@/components/FeaturePage';
import IntervalGame from '@/components/IntervalGame';

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

  return (
    <FeaturePage homeLabel={t('nav.home')} title={t('intervals.title')} exclude="/intervals">
      {/* C 大调音阶参考：不懂的人可顺着音名数音级来推理 */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5">
        {C_MAJOR_NOTES.map((n) => (
          <span
            key={n}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card-2 text-base font-bold text-text"
          >
            {n}
          </span>
        ))}
      </div>
      <IntervalGame />
    </FeaturePage>
  );
}