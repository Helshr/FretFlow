import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // 允许用 127.0.0.1 访问 dev 服务器（Next 16 默认拦截未列出的 dev 源，页面 JS 不加载、按钮点不动）
  allowedDevOrigins: ['127.0.0.1'],
};

export default withNextIntl(nextConfig);
