import type {Metadata} from 'next';
import {routing} from '@/i18n/routing';

export const SITE_URL = 'https://fretflow.art';

// 某 locale 下某页面的路径（defaultLocale 无前缀）
export function localePath(locale: string, path: string): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${prefix}${path}`;
}

// 完整 URL（根路径补尾斜杠）
export function absoluteUrl(locale: string, path: string): string {
  const base = `${SITE_URL}${localePath(locale, path)}`;
  return path === '' ? `${base}/` : base;
}

// 所有语言版本的 URL（用于 hreflang / alternates）
export function languageAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {'x-default': absoluteUrl(routing.defaultLocale, path)};
  for (const l of routing.locales) out[l] = absoluteUrl(l, path);
  return out;
}

// 单页 metadata：title（layout 模板会追加 " — FretFlow"）+ desc + OG + hreflang
export function pageMetadata(
  title: string,
  description: string,
  path: string,
  locale: string,
): Metadata {
  return {
    title,
    description,
    openGraph: {
      title: `${title} — FretFlow`,
      description,
      type: 'website',
      siteName: 'FretFlow',
      locale: locale.replace('-', '_'),
    },
    alternates: {languages: languageAlternates(path)},
  };
}
