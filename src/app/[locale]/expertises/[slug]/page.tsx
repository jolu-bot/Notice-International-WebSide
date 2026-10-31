import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fr } from '@/content/fr';
import { getContent } from '@/lib/content';
import { href, isLocale, locales } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata, serviceJsonLd } from '@/lib/seo';
import { PageHero } from '@/components/sections/Sections';
import { Btn, TLink } from '@/components/fx/TLink';
import { Picture } from '@/components/ui/Picture';
import { ArrowRight } from '@/components/ui/Icons';
import { JsonLd } from '@/components/ui/JsonLd';

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = true;
export function generateStaticParams() {
  return locales.flatMap((locale) => fr.services.items.map((s) => ({ locale, slug: s.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const c = await getContent(locale);
  const s = c.services.items.find((x) => x.slug === slug);
  if (!s) return {};
  return pageMetadata(c, locale, 'services', 'services', { sub: slug, title: `${s.title} — ${s.short}`, description: s.description.slice(0, 158), image: s.image.startsWith('/images/') ? `${s.image}-1600.webp` : s.image });
}

export default async function ServicePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const c = await getContent(locale);
  const index = c.services.items.findIndex((x) => x.slug === slug);
  if (index < 0) notFound();
  const s = c.services.items[index];
  const related = c.work.items.filter((p) => p.services.includes(slug)).slice(0, 3);
  const others = c.services.items.filter((x) => x.slug !== slug);

  return (
    <>
      <PageHero kicker={`${String(index + 1).padStart(2, '0')} — ${s.universe === 'immo' ? c.universes.immo.name : c.services.label}`} title={s.title} lead={s.short} image={s.image}
        crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: c.nav.services, href: href(locale, 'services') }, { label: s.title }]} />

      <section className="section theme-light">
        <div className="wrap grid gap-16 lg:grid-cols-[1fr_1.1fr]">
          <div className="lg:sticky lg:top-32 lg:h-fit">
            <p className="font-display text-[clamp(1.4rem,1.1rem+1vw,2.1rem)] leading-[1.35]" data-reveal>{s.description}</p>
            <div className="mt-10 flex flex-wrap gap-3" data-reveal>
              <Btn href={`${href(locale, 'quote')}?service=${s.slug}`}>{c.cta.secondary}</Btn>
              <Btn href={href(locale, 'appointment')} variant="ghost">{c.cta.primary}</Btn>
            </div>
          </div>
          <div>
            <p className="kicker" data-reveal>{c.common.whatWeDo}</p>
            <ol className="mt-8" data-stagger="0.07">
              {s.points.map((pt, i) => (
                <li key={pt} className="group flex items-baseline gap-6 border-t border-[var(--line)] py-6 last:border-b">
                  <span className="num text-sm text-[var(--c-orange)]">{String(i + 1).padStart(2, '0')}</span>
                  <span className="h3 !text-[clamp(1.2rem,1rem+.8vw,1.7rem)] transition-transform duration-700 group-hover:translate-x-2">{pt}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section theme-dark">
          <div className="wrap">
            <p className="kicker" data-reveal>{c.common.related}</p>
            <ul className="mt-12 grid gap-6 md:grid-cols-3" data-stagger>
              {related.map((p) => (
                <li key={p.slug}>
                  <TLink href={href(locale, 'work', p.slug)} className="group block" data-cursor={c.common.seeProject.split(' ')[0]}>
                    <div className="img-zoom aspect-[4/3] overflow-hidden rounded-[1.4rem]"><Picture src={p.cover} alt={p.title} className="h-full w-full" sizes="(min-width:768px) 33vw, 100vw" /></div>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-[var(--c-orange)]">{p.client}</p>
                    <h3 className="h3 mt-1 !text-xl">{p.title}</h3>
                  </TLink>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section-tight theme-light">
        <div className="wrap">
          <p className="kicker" data-reveal>{c.common.otherServices}</p>
          <ul className="mt-8 flex flex-wrap gap-2" data-reveal>
            {others.map((o) => (
              <li key={o.slug}><TLink href={href(locale, 'services', o.slug)} className="chip">{o.title} <ArrowRight size={14} /></TLink></li>
            ))}
          </ul>
        </div>
      </section>
      <JsonLd data={serviceJsonLd(locale, s)} />
      <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: c.nav.services, path: href(locale, 'services') }, { name: s.title, path: href(locale, 'services', s.slug) }])} />
    </>
  );
}
