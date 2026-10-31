import type { Metadata } from 'next';
import type { Content } from '@/content/fr';
import type { Settings } from '@/content/settings';
import { SITE_URL } from './site';
import { alternates, href, ogLocale, type Locale, type RouteKey } from './i18n';

type PageKey = keyof Content['meta']['pages'];

export function pageMetadata(
  c: Content,
  locale: Locale,
  page: PageKey,
  route: RouteKey,
  opts: { sub?: string; title?: string; description?: string; image?: string } = {},
): Metadata {
  const title = opts.title ?? c.meta.pages[page].title;
  const description = opts.description ?? c.meta.pages[page].description;
  const alt = alternates(locale, route, opts.sub);
  const images = opts.image
    ? [{ url: opts.image, width: 1600, height: 1000, alt: title }, { url: `/og/og-${locale}.jpg`, width: 1200, height: 630, alt: c.meta.siteName }]
    : [{ url: `/og/og-${locale}.jpg`, width: 1200, height: 630, alt: c.meta.defaultTitle }];
  return {
    title: page === 'home' && !opts.title ? { absolute: c.meta.defaultTitle } : title,
    description,
    keywords: c.meta.keywords,
    alternates: alt,
    openGraph: {
      type: 'website',
      siteName: c.meta.siteName,
      title,
      description,
      url: alt.canonical,
      locale: ogLocale[locale],
      alternateLocale: [ogLocale[locale === 'fr' ? 'en' : 'fr']],
      ...(images ? { images } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, ...(images ? { images: images.map((i) => i.url) } : {}) },
  };
}

const abs = (path: string) => (path.startsWith('http') ? path : `${SITE_URL}${path}`);

export function organizationJsonLd(c: Content, s: Settings, locale: Locale) {
  const sameAs = Object.values(s.socials).filter(Boolean);
  const address = {
    '@type': 'PostalAddress',
    streetAddress: `${s.address.street}, ${s.address.district}`,
    addressLocality: s.address.city,
    addressRegion: s.address.region,
    addressCountry: s.address.countryCode,
  };
  const org = {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': `${SITE_URL}/#organization`,
    name: s.brand.name,
    legalName: s.brand.legalName,
    alternateName: [s.brand.branch, 'Notice Immo and Building', 'NI Douala'],
    slogan: s.brand.slogan,
    description: c.meta.description,
    url: abs(`/${locale}`),
    logo: abs('/brand/logo-512.png'),
    image: abs('/brand/logo-512.png'),
    foundingDate: s.brand.foundingYear,
    founder: { '@type': 'Person', name: s.legal.director, jobTitle: locale === 'fr' ? 'Fondateur & Directeur Général' : 'Founder & Managing Director' },
    email: s.contact.email,
    telephone: s.contact.phonePrimary.replace(/\s/g, ''),
    address,
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address.mapQuery)}`,
    areaServed: [{ '@type': 'Country', name: 'Cameroon' }, { '@type': 'Place', name: 'Africa' }],
    knowsLanguage: ['fr', 'en'],
    priceRange: '$$',
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: s.hours.weekdays.split('–')[0], closes: s.hours.weekdays.split('–')[1] },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: s.hours.saturday.split('–')[0], closes: s.hours.saturday.split('–')[1] },
    ],
    contactPoint: [
      { '@type': 'ContactPoint', contactType: 'customer service', telephone: s.contact.phonePrimary.replace(/\s/g, ''), email: s.contact.email, availableLanguage: ['French', 'English'], areaServed: 'CM' },
      { '@type': 'ContactPoint', contactType: 'sales', telephone: s.contact.phoneSecondary.replace(/\s/g, ''), availableLanguage: ['French', 'English'] },
    ],
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'RCCM', value: s.legal.rccm },
      { '@type': 'PropertyValue', propertyID: 'NIU', value: s.legal.niu },
    ],
    sameAs,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: c.services.title,
      itemListElement: c.services.items.map((sv) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: sv.title, description: sv.description, url: abs(href(locale, 'services', sv.slug)) },
      })),
    },
  };
  const website = {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: s.brand.name,
    inLanguage: ['fr-FR', 'en'],
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
  return { '@context': 'https://schema.org', '@graph': [org, website] };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function faqJsonLd(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: it.a } })),
  };
}

export function serviceJsonLd(locale: Locale, sv: Content['services']['items'][number]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: sv.title,
    description: sv.description,
    serviceType: sv.title,
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: { '@type': 'Country', name: 'Cameroon' },
    url: abs(href(locale, 'services', sv.slug)),
    image: sv.image ? abs(sv.image.startsWith('/images/') ? `${sv.image}-1600.webp` : sv.image) : undefined,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: sv.title,
      itemListElement: sv.points.map((p) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: p } })),
    },
  };
}

export function projectJsonLd(locale: Locale, p: Content['work']['items'][number]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    description: p.summary,
    url: abs(href(locale, 'work', p.slug)),
    image: p.gallery.slice(0, 4).map((g) => abs(g.startsWith('/images/') ? `${g}-1600.webp` : g)),
    creator: { '@id': `${SITE_URL}/#organization` },
    about: p.client,
    locationCreated: p.location ? { '@type': 'Place', name: p.location } : undefined,
    inLanguage: locale,
  };
}
