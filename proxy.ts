import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // 跳过 api、_next、_vercel 及含点号的文件路径
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
