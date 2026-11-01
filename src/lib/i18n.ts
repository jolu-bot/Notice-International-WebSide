export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/**
 * Pages du site. Le dossier interne (app/[locale]/…) porte toujours le slug français ;
 * les slugs anglais sont réécrits par le proxy. Un slug traduit = un meilleur référencement.
 */
export const ROUTES = {
  home: { fr: '', en: '' },
  agency: { fr: 'agence', en: 'agency' },
  services: { fr: 'expertises', en: 'expertise' },
  immo: { fr: 'immo-building', en: 'immo-building' },
  work: { fr: 'realisations', en: 'work' },
  contact: { fr: 'contact', en: 'contact' },
  appointment: { fr: 'rendez-vous', en: 'appointment' },
  quote: { fr: 'devis', en: 'quote' },
  careers: { fr: 'carrieres', en: 'careers' },
  news: { fr: 'actualites', en: 'news' },
  legal: { fr: 'mentions-legales', en: 'legal-notice' },
  privacy: { fr: 'confidentialite', en: 'privacy' },
  cookies: { fr: 'cookies', en: 'cookies' },
  terms: { fr: 'cgu', en: 'terms' },
} as const;

export type RouteKey = keyof typeof ROUTES;

export function href(locale: Locale, key: RouteKey, sub?: string): string {
  const slug = ROUTES[key][locale];
  return `/${locale}${slug ? `/${slug}` : ''}${sub ? `/${sub}` : ''}`;
}

/** Retrouve la clé de route à partir d'un slug, quelle que soit la langue. */
export function routeKeyFromSlug(slug: string): RouteKey | null {
  for (const [key, r] of Object.entries(ROUTES)) if (r.fr === slug || r.en === slug) return key as RouteKey;
  return null;
}

/** Calcule l'URL équivalente dans l'autre langue (sélecteur de langue, hreflang). */
export function switchLocalePath(pathname: string, target: Locale): string {
  const parts = pathname.split('/').filter(Boolean);
  if (!parts.length || !isLocale(parts[0])) return `/${target}`;
  const [, first, ...rest] = parts;
  if (!first) return `/${target}`;
  const key = routeKeyFromSlug(first);
  const slug = key ? ROUTES[key][target] : first;
  return `/${[target, slug, ...rest].filter(Boolean).join('/')}`;
}

export function alternates(locale: Locale, key: RouteKey, sub?: string) {
  return {
    canonical: href(locale, key, sub),
    languages: {
      fr: href('fr', key, sub),
      en: href('en', key, sub),
      'x-default': href('fr', key, sub),
    },
  };
}

export const ogLocale: Record<Locale, string> = { fr: 'fr_FR', en: 'en_US' };
