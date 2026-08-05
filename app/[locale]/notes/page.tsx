'use client';

import {useTranslations} from 'next-intl';
import FeaturePage from '@/components/FeaturePage';
import NoteTrainer from '@/components/NoteTrainer';

export default function NotesPage() {
  const t = useTranslations();

  return (
    <FeaturePage homeLabel={t('nav.home')} title={t('notes.title')}>
      <NoteTrainer />
    </FeaturePage>
  );
}
