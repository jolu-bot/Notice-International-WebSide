import { NextResponse, type NextRequest } from 'next/server';
import { ROUTES, defaultLocale, isLocale, type Locale } from '@/lib/i18n';

function preferredLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get('NEXT_LOCALE')?.value;
  if (isLocale(cookie)) return cookie;
  const accept = req.headers.get('accept-language') ?? '';
  const ranked = accept
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of ranked) if (isLocale(lang)) return lang;
  return defaultLocale;
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const parts = pathname.split('/').filter(Boolean);

  // 1. Pas de langue dans l'URL → redirection vers la langue préférée du visiteur
  if (!isLocale(parts[0])) {
    const url = req.nextUrl.clone();
    url.pathname = `/${preferredLocale(req)}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url, 307);
  }

  const locale = parts[0];
  const slug = parts[1];
  if (!slug) return NextResponse.next();

  const route = Object.values(ROUTES).find((r) => r.fr === slug || r.en === slug);
  if (!route) return NextResponse.next();

  // 2. Slug de l'autre langue → redirection permanente vers le slug canonique
  if (route[locale] !== slug) {
    const url = req.nextUrl.clone();
    url.pathname = `/${[locale, route[locale], ...parts.slice(2)].join('/')}`;
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  // 3. Slug anglais → réécriture vers le dossier interne (français)
  if (route.fr !== slug) {
    const url = req.nextUrl.clone();
    url.pathname = `/${[locale, route.fr, ...parts.slice(2)].join('/')}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|admin|_next|_vercel|images|media|brand|favicon|icon|apple-icon|opengraph-image|twitter-image|manifest|robots|sitemap|llms|.*\\..*).*)'],
};
