import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent, getSettings } from '@/lib/content';
import { href, isLocale, type RouteKey } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { fillTokens } from '@/lib/utils';
import { Markdown } from '../ui/Markdown';
import { JsonLd } from '../ui/JsonLd';
import { PageHero } from './Sections';

type Doc = 'notice' | 'privacy' | 'cookiesPolicy' | 'terms';
type Page = 'legal' | 'privacy' | 'cookies' | 'terms';
type Props = { params: Promise<{ locale: string }> };

export function legalMetadata(page: Page) {
  return async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    if (!isLocale(locale)) return {};
    return { ...pageMetadata(await getContent(locale), locale, page, page as RouteKey), robots: { index: true, follow: true } };
  };
}

export function legalPage(doc: Doc, page: Page) {
  return async function LegalPage({ params }: Props) {
    const { locale } = await params;
    if (!isLocale(locale)) notFound();
    const [c, s] = await Promise.all([getContent(locale), getSettings()]);
    const d = c.legal[doc];
    const tokens = {
      rccm: s.legal.rccm, niu: s.legal.niu, taxRegime: s.legal.taxRegime, director: s.legal.director, email: s.contact.email,
      phonePrimary: s.contact.phonePrimary, phoneSecondary: s.contact.phoneSecondary, hostName: s.legal.hostName, hostAddress: s.legal.hostAddress, dataHost: s.legal.dataHost,
    };
    const links: Array<[Page, string]> = [['legal', c.footer.legalNotice], ['privacy', c.footer.privacy], ['cookies', c.footer.cookies], ['terms', c.footer.terms]];
    return (
      <>
        <PageHero kicker={c.footer.legal} title={d.title} lead={c.legal.updated} crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: d.title }]} />
        <section className="section theme-light pt-[clamp(3rem,6vw,5rem)]">
          <div className="wrap grid gap-14 lg:grid-cols-[16rem_1fr]">
            <nav aria-label={c.footer.legal} className="lg:sticky lg:top-32 lg:h-fit">
              <ul className="flex flex-wrap gap-2 lg:flex-col">
                {links.map(([k, label]) => (
                  <li key={k}><a href={href(locale, k)} className={`chip w-full ${k === page ? 'is-active' : ''}`} aria-current={k === page ? 'page' : undefined}>{label}</a></li>
                ))}
              </ul>
            </nav>
            <Markdown source={fillTokens(d.body, tokens)} className="prose-ni" />
          </div>
        </section>
        <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: d.title, path: href(locale, page) }])} />
      </>
    );
  };
}
