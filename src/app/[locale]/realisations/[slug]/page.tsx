import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fr } from '@/content/fr';
import { getContent } from '@/lib/content';
import { href, isLocale, locales } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata, projectJsonLd } from '@/lib/seo';
import { PageHero } from '@/components/sections/Sections';
import { Gallery } from '@/components/sections/Gallery';
import { Btn, TLink } from '@/components/fx/TLink';
import { Picture } from '@/components/ui/Picture';
import { ArrowRight } from '@/components/ui/Icons';
import { JsonLd } from '@/components/ui/JsonLd';

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = true;
export function generateStaticParams() {
  return locales.flatMap((locale) => fr.work.items.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const c = await getContent(locale);
  const p = c.work.items.find((x) => x.slug === slug);
  if (!p) return {};
  return pageMetadata(c, locale, 'work', 'work', { sub: slug, title: `${p.title} — ${p.client}`, description: p.summary, image: p.cover.startsWith('/images/') ? `${p.cover}-1600.webp` : p.cover });
}

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const c = await getContent(locale);
  const i = c.work.items.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = c.work.items[i];
  const next = c.work.items[(i + 1) % c.work.items.length];
  const services = c.services.items.filter((s) => p.services.includes(s.slug));
  const meta: Array<[string, string]> = [
    [c.common.client, p.client],
    [c.common.category, c.work.filters[p.category as keyof typeof c.work.filters] ?? p.category],
    [c.common.year, p.year],
    [c.common.location, p.location],
  ].filter(([, v]) => v) as Array<[string, string]>;

  return (
    <>
      <PageHero kicker={p.client} title={p.title} lead={p.summary} image={p.cover}
        crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: c.nav.work, href: href(locale, 'work') }, { label: p.client }]} />

      <section className="section theme-light">
        <div className="wrap grid gap-14 lg:grid-cols-[1fr_2fr]">
          <dl className="h-fit divide-y divide-[var(--line)] border-y border-[var(--line)] lg:sticky lg:top-32" data-reveal>
            {meta.map(([k, v]) => (
              <div key={k} className="py-4"><dt className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>
            ))}
            {services.length > 0 && (
              <div className="py-4">
                <dt className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">{c.nav.services}</dt>
                <dd className="mt-2 flex flex-wrap gap-2">{services.map((s) => <TLink key={s.slug} href={href(locale, 'services', s.slug)} className="chip !py-1.5 !text-xs">{s.title}</TLink>)}</dd>
              </div>
            )}
          </dl>
          <div>
            <p className="font-display text-[clamp(1.4rem,1.1rem+1vw,2.1rem)] leading-[1.4]" data-reveal>{p.body}</p>
            <div className="mt-16">
              <p className="kicker mb-8" data-reveal>{c.common.gallery}</p>
              <Gallery images={p.gallery} alt={p.title} label={c.common.gallery} />
            </div>
          </div>
        </div>
      </section>

      <section className="theme-dark">
        <TLink href={href(locale, 'work', next.slug)} className="group relative block overflow-hidden" data-cursor={c.common.next}>
          <div className="absolute inset-0 opacity-30 transition-opacity duration-1000 group-hover:opacity-60">
            <Picture src={next.cover} alt="" className="h-full w-full" sizes="100vw" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[color-mix(in_srgb,var(--bg)_70%,transparent)] to-transparent" />
          <div className="wrap relative py-[clamp(5rem,12vw,10rem)]">
            <p className="kicker">{c.common.next}</p>
            <p className="mt-4 text-sm font-bold uppercase tracking-[.16em] text-[var(--c-orange)]">{next.client}</p>
            <p className="h1 mt-3 max-w-[16ch] transition-transform duration-1000 group-hover:translate-x-4">{next.title}</p>
            <span className="mt-8 inline-flex items-center gap-3 font-bold">{c.common.seeProject} <ArrowRight size={18} /></span>
          </div>
        </TLink>
      </section>

      <section className="section-tight theme-light text-center">
        <div className="wrap">
          <h2 className="h2 mx-auto max-w-[18ch]" data-split>{c.cta.title}</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3" data-reveal>
            <Btn href={href(locale, 'quote')}>{c.cta.secondary}</Btn>
            <Btn href={href(locale, 'work')} variant="ghost">{c.common.seeAll}</Btn>
          </div>
        </div>
      </section>
      <JsonLd data={projectJsonLd(locale, p)} />
      <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: c.nav.work, path: href(locale, 'work') }, { name: p.title, path: href(locale, 'work', p.slug) }])} />
    </>
  );
}
