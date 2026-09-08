import type {ReactNode} from 'react';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import PageHeader from './PageHeader';

// 功能页通用骨架：顶部返回首页 + 语言切换，居中标题，正文容器，
// 底部展示「其他吉他工具」内部链接区（传入 exclude 过滤当前页）。
export default async function FeaturePage({
  homeLabel,
  title,
  children,
  maxWidth = 'max-w-[900px]',
  exclude,
}: {
  homeLabel: string;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  exclude?: string;
}) {
  const t = await getTranslations('home');
  const tools = [
    {href: '/tuner', title: t('tunerTitle'), desc: t('tunerDesc')},
    {href: '/trainer', title: t('trainerTitle'), desc: t('trainerDesc')},
    {href: '/notes', title: t('notesTitle'), desc: t('notesDesc')},
    {href: '/chords', title: t('chordChartTitle'), desc: t('chordChartDesc')},
    {href: '/slide-rule', title: t('slideRuleTitle'), desc: t('slideRuleDesc')},
  ].filter((tool) => tool.href !== exclude);

  return (
    <main className={`mx-auto w-full flex-1 px-4 py-6 ${maxWidth}`}>
      <PageHeader
        left={
          <Link href="/" className="rounded-lg border border-line bg-card-2 px-3 py-1.5 text-muted hover:text-text">
            {homeLabel}
          </Link>
        }
      />
      <h1 className="mb-6 text-center text-2xl font-bold">{title}</h1>
      {children}

      <section className="mt-14 border-t border-line pt-8">
        <h2 className="text-lg font-bold">{t('toolsTitle')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-xl border border-line bg-card p-4 transition-colors hover:bg-card-2"
            >
              <div className="text-sm font-bold">{tool.title}</div>
              <div className="mt-1 text-sm leading-relaxed text-muted">{tool.desc}</div>
              <div className="mt-2 text-xs font-semibold text-accent">→</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}