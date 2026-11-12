import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import FeaturePage from '@/components/FeaturePage';
import FindNoteGame from '@/components/FindNoteGame';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale});
  return pageMetadata(t('findNote.title'), t('home.findNoteDesc'), '/find-note', locale);
}

export default async function FindNotePage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <FeaturePage
      homeLabel={t('nav.home')}
      title={t('findNote.title')}
      exclude="/find-note"
    >
      <p className="mb-6 text-center text-sm text-muted">{t('findNote.subtitle')}</p>
      <FindNoteGame />
    </FeaturePage>
  );
}