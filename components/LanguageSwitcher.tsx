'use client';

import {useLocale} from 'next-intl';
import {useTransition} from 'react';
import {usePathname, useRouter} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';

const LABELS: Record<string, string> = {
  'zh-CN': '中文',
  en: 'English',
};

export default function LanguageSwitcher({
  className = 'border-line bg-card-2 text-text',
}: {
  className?: string;
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    startTransition(() => {
      router.replace(pathname, {locale: nextLocale});
    });
  }

  return (
    <select
      value={locale}
      onChange={onSelectChange}
      disabled={isPending}
      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${className}`}
      aria-label="Language"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LABELS[l]}
        </option>
      ))}
    </select>
  );
}
