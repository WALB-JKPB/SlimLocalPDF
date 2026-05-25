import { NextResponse, type NextRequest } from 'next/server';
import { detectLocaleFromAcceptLanguage } from '@/lib/i18n';

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== '/') {
    return NextResponse.next();
  }

  const locale = detectLocaleFromAcceptLanguage(request.headers.get('accept-language'));
  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}

export const config = {
  matcher: '/',
};
