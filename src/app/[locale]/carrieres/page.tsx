import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { href, isLocale } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { PageHero } from '@/components/sections/Sections';
import { CareerForm } from '@/components/forms/CareerForm';
import { JsonLd } from '@/components/ui/JsonLd';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(await getContent(locale), locale, 'careers', 'careers', { image: '/images/work/casting-1-1600.webp' });
}

export default async function CareersPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = await getContent(locale);
  const p = c.careersPage;
  return (
    <>
      <PageHero kicker={p.kicker} title={p.title} lead={p.lead} image="/images/work/chococam-2" crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: c.nav.careers }]} />
      <section className="section-tight theme-dark">
        <div className="wrap">
          <p className="kicker" data-reveal>{p.perksTitle}</p>
          <ul className="mt-10 grid gap-5 md:grid-cols-3" data-stagger>
            {p.perks.map((k, i) => (
              <li key={k.title} className="card card-hover p-8">
                <span className="num text-5xl text-[var(--c-orange)]">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h3 mt-6">{k.title}</h3>
                <p className="mt-3 text-[var(--muted)]">{k.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section theme-light">
        <div className="wrap">
          <div className="card p-6 md:p-12" data-reveal>
            <CareerForm locale={locale} t={c.forms} p={p} cityLabel={c.quotePage.cityLabel} />
          </div>
        </div>
      </section>
      <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: c.nav.careers, path: href(locale, 'careers') }])} />
    </>
  );
}
