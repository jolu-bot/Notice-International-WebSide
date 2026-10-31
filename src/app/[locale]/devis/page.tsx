import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { href, isLocale } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { PageHero } from '@/components/sections/Sections';
import { QuoteForm } from '@/components/forms/QuoteForm';
import { JsonLd } from '@/components/ui/JsonLd';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(await getContent(locale), locale, 'quote', 'quote');
}

export default async function QuotePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = await getContent(locale);
  const p = c.quotePage;
  return (
    <>
      <PageHero kicker={p.kicker} title={p.title} lead={p.lead} crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: c.nav.quote }]} />
      <section className="section theme-light pt-[clamp(3rem,6vw,5rem)]">
        <div className="wrap">
          <div className="card p-6 md:p-12" data-reveal>
            <QuoteForm locale={locale} t={c.forms} p={p} services={c.services.items.map((s) => ({ slug: s.slug, title: s.title }))} />
          </div>
        </div>
      </section>
      <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: c.nav.quote, path: href(locale, 'quote') }])} />
    </>
  );
}
