import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { href, isLocale } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { PageHero } from '@/components/sections/Sections';
import { Btn, TLink } from '@/components/fx/TLink';
import { Picture } from '@/components/ui/Picture';
import { ArrowRight } from '@/components/ui/Icons';
import { JsonLd } from '@/components/ui/JsonLd';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(await getContent(locale), locale, 'immo', 'immo', { image: '/images/brand/solar-1600.webp' });
}

export default async function ImmoPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = await getContent(locale);
  const p = c.immoPage;
  const btp = c.services.items.find((s) => s.slug === 'btp-energie');
  const immo = c.services.items.find((s) => s.slug === 'immobilier');
  const blocks = [
    { title: p.solarTitle, text: p.solarText, img: '/images/brand/solar', service: btp },
    { title: p.realEstateTitle, text: p.realEstateText, img: '/images/brand/house-keys', service: immo },
  ];

  return (
    <>
      <PageHero kicker={p.kicker} title={p.title} lead={p.lead} image="/images/brand/construction"
        crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: c.nav.immo }]}>
        <ol className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2 font-display text-[clamp(1.6rem,1rem+2.5vw,3.4rem)] leading-none" data-stagger="0.15">
          {p.triad.map((w, i) => (
            <li key={w} className="flex items-center gap-6">
              <span className={i === 1 ? 'italic-accent grad-text' : ''}>{w}</span>
              {i < p.triad.length - 1 && <span className="h-2 w-2 rotate-45 bg-[var(--c-orange)]" />}
            </li>
          ))}
        </ol>
      </PageHero>

      {blocks.map((b, i) => (
        <section key={b.title} className={cn('section', i % 2 ? 'theme-dark' : 'theme-light')}>
          <div className={cn('wrap grid items-center gap-14 lg:grid-cols-2', i % 2 === 1 && 'lg:[&>*:first-child]:order-2')}>
            <div className="aspect-[5/4] overflow-hidden rounded-[2rem]" data-img-reveal>
              <Picture src={b.img} alt={b.title} className="h-full w-full" />
            </div>
            <div>
              <h2 className="h2 max-w-[14ch]" data-split>{b.title}</h2>
              <p className="lead mt-6" data-reveal>{b.text}</p>
              {b.service && (
                <ul className="mt-10 grid gap-x-8 gap-y-3 sm:grid-cols-2" data-stagger="0.05">
                  {b.service.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-3 border-b border-[var(--line)] pb-3">
                      <span className="mt-2 h-2 w-2 flex-none rotate-45 bg-[var(--c-orange)]" />{pt}
                    </li>
                  ))}
                </ul>
              )}
              {b.service && (
                <TLink href={href(locale, 'services', b.service.slug)} className="mt-10 inline-flex items-center gap-2 font-bold link-underline" data-reveal>
                  {b.service.title} <ArrowRight size={16} />
                </TLink>
              )}
            </div>
          </div>
        </section>
      ))}

      <section className="section-tight theme-dark text-center">
        <div className="wrap">
          <h2 className="h2 mx-auto max-w-[18ch]" data-split>{c.universes.immo.text}</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3" data-reveal>
            <Btn href={`${href(locale, 'quote')}?service=btp-energie`}>{p.cta}</Btn>
            <Btn href={href(locale, 'appointment')} variant="ghost">{c.cta.primary}</Btn>
          </div>
        </div>
      </section>
      <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: c.nav.immo, path: href(locale, 'immo') }])} />
    </>
  );
}
