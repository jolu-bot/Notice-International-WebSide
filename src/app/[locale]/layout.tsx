import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Fraunces, Manrope } from 'next/font/google';
import '../globals.css';
import { getContent, getSettings } from '@/lib/content';
import { href, isLocale, locales, ogLocale } from '@/lib/i18n';
import { organizationJsonLd } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { Experience } from '@/components/fx/Experience';
import { Preloader } from '@/components/fx/Preloader';
import { RouteShell } from '@/components/fx/RouteShell';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppFab } from '@/components/layout/WhatsAppFab';
import { ConsentProvider } from '@/components/consent/Consent';
import { JsonLd } from '@/components/ui/JsonLd';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', axes: ['opsz', 'SOFT', 'WONK'], style: ['normal', 'italic'], display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

// Avant le premier rendu : active les animations JS et saute le préchargeur déjà vu
const INIT = `(function(){var d=document.documentElement;d.classList.add('js');try{if(sessionStorage.getItem('ni-pl'))d.classList.add('pl-done')}catch(e){}})();`;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#070a17',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = await getContent(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: c.meta.defaultTitle, template: c.meta.titleTemplate },
    description: c.meta.description,
    applicationName: c.meta.siteName,
    authors: [{ name: 'Notice International' }, { name: 'JoYed’S', url: 'https://www.joyeds.com' }],
    creator: 'JoYed’S',
    publisher: 'Notice International',
    category: 'business',
    formatDetection: { telephone: true, email: true, address: true },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    openGraph: { siteName: c.meta.siteName, locale: ogLocale[locale], type: 'website' },
    alternates: { canonical: href(locale, 'home'), languages: { fr: '/fr', en: '/en', 'x-default': '/fr' } },
    other: { 'geo.region': 'CM-LT', 'geo.placename': 'Douala', 'content-language': locale },
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [c, settings] = await Promise.all([getContent(locale), getSettings()]);

  return (
    <html lang={locale} className={`${fraunces.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INIT }} />
      </head>
      <body>
        <a href="#main" className="skip-link">{c.nav.skip}</a>
        <Experience>
          <ConsentProvider t={c.cookies} policyHref={href(locale, 'cookies')}>
            <Preloader words={c.preloader.words} since={Number(settings.brand.foundingYear) || 2000} />
            <Header locale={locale} nav={c.nav} easter={c.easter} settings={settings} />
            <main id="main"><RouteShell>{children}</RouteShell></main>
            <Footer key={locale} locale={locale} c={c} settings={settings} />
            <WhatsAppFab t={c.whatsapp} settings={settings} />
          </ConsentProvider>
        </Experience>
        <div className="grain" aria-hidden />
        <JsonLd data={organizationJsonLd(c, settings, locale)} />
      </body>
    </html>
  );
}
