import type {ReactNode} from 'react';
import {Link} from '@/i18n/navigation';
import PageHeader from './PageHeader';

// 功能页通用骨架：顶部返回首页 + 语言切换，居中标题，正文容器
export default function FeaturePage({
  homeLabel,
  title,
  children,
  maxWidth = 'max-w-[900px]',
}: {
  homeLabel: string;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
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
    </main>
  );
}
