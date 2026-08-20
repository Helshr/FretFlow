import type {MetadataRoute} from 'next';
import {routing} from '@/i18n/routing';
import {absoluteUrl, languageAlternates} from '@/lib/seo';

const PAGES = ['', '/trainer', '/chords', '/notes', '/tuner', '/slide-rule'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({
    url: absoluteUrl(routing.defaultLocale, path),
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
    alternates: {languages: languageAlternates(path)},
  }));
}
