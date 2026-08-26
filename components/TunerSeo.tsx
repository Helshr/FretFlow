import {getTranslations} from 'next-intl/server';

// 西语调音器页的 SEO 内容块（服务端渲染，供搜索引擎索引）。
// 调音器本身是纯客户端 Web Audio，无索引文本，所以单独提供关键词内容 + FAQPage 结构化数据。
export default async function TunerSeo({locale}: {locale: string}) {
  const t = await getTranslations({locale, namespace: 'tuner.seo'});
  const steps = t.raw('steps') as {title: string; body: string}[];
  const strings = t.raw('strings') as {order: string; note: string}[];
  const tips = t.raw('tips') as string[];
  const faq = t.raw('faq') as {q: string; a: string}[];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {'@type': 'Answer', text: f.a},
    })),
  };

  return (
    <div className="mx-auto mt-12 max-w-[560px] border-t border-[#2a2a2a] pt-8 text-left">
      <h2 className="text-xl font-bold tracking-[-0.01em]">{t('h2')}</h2>
      <p className="mt-3 text-sm leading-relaxed text-[#a0a0a0]">{t('intro')}</p>

      <h3 className="mt-8 text-lg font-bold tracking-[-0.01em]">{t('stepsTitle')}</h3>
      <ol className="mt-3 grid gap-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8a850] text-sm font-bold text-[#0a0a0a]">
              {i + 1}
            </span>
            <div>
              <div className="text-sm font-bold">{s.title}</div>
              <div className="mt-1 text-sm leading-relaxed text-[#a0a0a0]">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>

      <h3 className="mt-8 text-lg font-bold tracking-[-0.01em]">{t('stringsTitle')}</h3>
      <p className="mt-2 text-sm text-[#a0a0a0]">{t('stringsNote')}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {strings.map((s) => (
          <div key={s.order} className="rounded-xl border border-[#2a2a2a] bg-[#141414] px-2 py-3 text-center">
            <div className="text-sm font-bold text-[#e8a850]">{s.note}</div>
            <div className="mt-0.5 text-xs text-[#6b6b6b]">{s.order}</div>
          </div>
        ))}
      </div>

      <h3 className="mt-8 text-lg font-bold tracking-[-0.01em]">{t('tipsTitle')}</h3>
      <ul className="mt-3 grid gap-2">
        {tips.map((tip, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-[#a0a0a0]">
            <span className="text-[#e8a850]">›</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-lg font-bold tracking-[-0.01em]">{t('faqTitle')}</h3>
      <dl className="mt-3 grid gap-2">
        {faq.map((f, i) => (
          <details
            key={i}
            className="group rounded-xl border border-[#2a2a2a] bg-[#141414] px-4 py-3"
          >
            <summary className="cursor-pointer select-none text-sm font-bold [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="float-right text-[#e8a850] transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-[#a0a0a0]">{f.a}</p>
          </details>
        ))}
      </dl>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}}
      />
    </div>
  );
}