import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['zh-CN', 'en', 'ja', 'ko', 'es', 'fr'],
  defaultLocale: 'zh-CN',
  localePrefix: 'as-needed',
  // 关闭浏览器语言自动检测：打开域名根路径始终是中文，英文走 /en
  localeDetection: false
});
