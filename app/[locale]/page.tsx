'use client';

import {useTranslations} from 'next-intl';
import Image from 'next/image';
import {useEffect} from 'react';
import {Link} from '@/i18n/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import FeatureCard from '@/components/FeatureCard';

/**
 * FretFlow 首页 — 深色主题重设计（黑 + 金）
 * 布局：固定导航（滚动毛玻璃）→ 全屏吉他 Hero → 2×2 功能卡片 → 页脚
 */

const CARDS = [
  {href: '/tuner', tag: 'tuner', title: 'tunerTitle', desc: 'tunerDesc', link: 'enter'},
  {href: '/trainer', tag: 'trainer', title: 'trainerTitle', desc: 'trainerDesc', link: 'enter'},
  {href: '/chords', tag: 'chordChart', title: 'chordChartTitle', desc: 'chordChartDesc', link: 'enter'},
  {href: '/notes', tag: 'notes', title: 'notesTitle', desc: 'notesDesc', link: 'enter'},
  {href: '/slide-rule', tag: 'slideRule', title: 'slideRuleTitle', desc: 'slideRuleDesc', link: 'enter'},
] as const;

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] antialiased">
      <Nav />

      {/* HERO — 全屏吉他 Banner */}
      <section className="relative flex h-screen min-h-[700px] items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-guitar.jpg"
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
            style={{objectPosition: 'center 35%', filter: 'brightness(0.55)'}}
          />
        </div>

        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0) 30%, rgba(10,10,10,0.3) 60%, rgba(10,10,10,0.85) 85%, rgba(10,10,10,0.98) 100%), linear-gradient(90deg, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.2) 40%, rgba(10,10,10,0) 55%, rgba(10,10,10,0) 100%)',
          }}
        />

        <div className="relative z-[2] mx-auto w-full max-w-[1200px] px-10 pb-20 max-md:px-5 max-md:pb-16">
          <p className="animate-fade-up text-sm font-semibold uppercase tracking-[0.15em] text-[#e8a850] [animation-delay:200ms] [animation-fill-mode:forwards]">
            {t('heroEyebrow')}
          </p>
          <h1 className="animate-fade-up mt-4 max-w-[700px] text-[clamp(3rem,7vw,5.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] [animation-delay:350ms] [animation-fill-mode:forwards]">
            {t('heroTitle1')}
            <br />
            {t('heroTitle2')}
            <span className="text-[#e8a850]">{t('heroTitle3')}</span>
          </h1>
          <p className="animate-fade-up mt-4 max-w-[480px] text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed text-white/65 [animation-delay:500ms] [animation-fill-mode:forwards]">
            {t('heroDesc')}
          </p>
          <Link
            href="#features"
            className="animate-fade-up mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#e8a850] px-8 py-3.5 text-base font-bold text-[#0a0a0a] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_60px_rgba(232,168,80,0.5)] [animation-delay:650ms] [animation-fill-mode:forwards] [box-shadow:0_0_40px_rgba(232,168,80,0.3)]"
          >
            {t('heroCta')}
            <ArrowIcon />
          </Link>
        </div>

      </section>

      {/* FEATURES — 功能卡片 */}
      <section
        id="features"
        className="relative z-[2] -mt-px bg-[#0a0a0a] px-10 py-20 pb-[100px] max-md:px-5 max-md:py-16"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-14 text-center">
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-bold tracking-[-0.02em]">{t('sectionTitle')}</h2>
            <p className="mx-auto mt-3 max-w-[480px] text-[1.0625rem] leading-relaxed text-[#a0a0a0]">
              {t('sectionSub')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {CARDS.map((card, i) => (
              <FeatureCard
                key={card.href}
                href={card.href}
                index={i + 1}
                delayMs={i * 100}
                tag={t(card.tag)}
                title={t(card.title)}
                desc={t(card.desc)}
                linkLabel={t(card.link)}
              />
            ))}

            <div className="relative flex animate-fade-up cursor-default flex-col gap-2.5 rounded-[20px] border border-[#2a2a2a] bg-[#141414] p-7 opacity-50 max-md:p-6" style={{animationDelay: '500ms'}}>
              <span className="pointer-events-none absolute right-6 top-5 select-none text-4xl font-black tracking-tighter text-[#2a2a2a]">
                {String(CARDS.length + 1).padStart(2, '0')}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#a0a0a0]">{t('comingSoon')}</span>
              <h3 className="text-xl font-bold tracking-[-0.01em]">{t('comingSoonTitle')}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* 署名（CC-BY 许可要求保留，极简） */}
      <p className="px-10 pb-8 pt-4 text-center text-[0.75rem] text-[#6b6b6b] max-md:px-5">
        Guitar samples by{' '}
        <a
          href="https://github.com/tonejs/tonejs-instruments"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8a8a8a] transition-colors hover:text-[#f5f5f5]"
        >
          Tone.js Instruments
        </a>{' '}
        (CC BY 3.0)
      </p>
    </div>
  );
}

/* 导航栏（滚动毛玻璃；语言切换复用现有组件） */
function Nav() {
  useEffect(() => {
    const handleScroll = () => {
      const nav = document.getElementById('main-nav');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      id="main-nav"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-between px-10 py-4 transition-all duration-500 ease-out max-md:px-5 [&.scrolled]:border-b [&.scrolled]:border-[#2a2a2a] [&.scrolled]:bg-[#0a0a0a]/85 [&.scrolled]:backdrop-blur-xl"
    >
      <div className="text-2xl font-bold tracking-[-0.02em]">
        Fret<span className="text-[#e8a850]">Flow</span>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/tone" className="rounded-full border border-[#e8a850]/50 px-4 py-2 text-sm text-[#e8a850] transition-colors hover:bg-[#e8a850] hover:text-[#0a0a0a]">
          NAM 音色
        </Link>
        <LanguageSwitcher className="border-[#2a2a2a] bg-[#1c1c1c] text-[#a0a0a0]" />
      </div>
    </nav>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
