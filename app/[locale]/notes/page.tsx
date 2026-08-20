import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import FeaturePage from '@/components/FeaturePage';
import NoteTrainer from '@/components/NoteTrainer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale});
  return pageMetadata(t('notes.title'), t('home.notesDesc'), '/notes', locale);
}

export default async function NotesPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <FeaturePage homeLabel={t('nav.home')} title={t('notes.title')}>
      <NoteTrainer />
    </FeaturePage>
  );
}
