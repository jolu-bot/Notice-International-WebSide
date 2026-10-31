import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { href, isLocale } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { Faq, Method, PageHero } from '@/components/sections/Sections';
import { TLink } from '@/components/fx/TLink';
import { Picture } from '@/components/ui/Picture';
import { ArrowUpRight } from '@/components/ui/Icons';
import { JsonLd } from '@/components/ui/JsonLd';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(await getContent(locale), locale, 'services', 'services');
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = await getContent(locale);
  const groups = [
    { key: 'com', title: c.universes.com.name, tag: c.universes.com.tag, items: c.services.items.filter((s) => s.universe !== 'immo') },
    { key: 'immo', title: c.universes.immo.name, tag: c.universes.immo.tag, items: c.services.items.filter((s) => s.universe === 'immo') },
  ];
  let n = 0;
  return (
    <>
      <PageHero kicker={c.services.label} title={c.services.title} lead={c.services.intro}
        crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: c.nav.services }]} />
      {groups.map((g) => (
        <section key={g.key} className={cn('section', g.key === 'com' ? 'theme-light' : 'theme-dark')}>
          <div className="wrap">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="h2" data-split>{g.title}</h2>
              <span className="tag" data-reveal>{g.tag}</span>
            </div>
            <ul className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {g.items.map((s) => {
                n += 1;
                return (
                  <li key={s.slug} data-reveal>
                    <TLink href={href(locale, 'services', s.slug)} className="card card-hover group flex h-full flex-col" data-cursor={c.common.discover}>
                      <div className="img-zoom relative aspect-[16/11] overflow-hidden">
                        <Picture src={s.image} alt={s.title} className="absolute inset-0" sizes="(min-width:1024px) 33vw, 100vw" />
                        <span className="num absolute left-5 top-5 rounded-full bg-[rgb(7_10_23/.7)] px-3 py-1 text-sm text-white backdrop-blur">{String(n).padStart(2, '0')}</span>
                      </div>
                      <div className="flex flex-1 flex-col p-7">
                        <h3 className="h3">{s.title}</h3>
                        <p className="mt-2 font-display text-lg italic-accent text-[var(--c-orange)]">{s.short}</p>
                        <ul className="mt-5 space-y-1.5 text-sm text-[var(--muted)]">
                          {s.points.slice(0, 4).map((pt) => <li key={pt} className="flex gap-2"><span className="mt-2 h-1 w-3 flex-none bg-[var(--c-orange)]" />{pt}</li>)}
                        </ul>
                        <span className="mt-auto flex items-center gap-2 pt-7 font-bold">
                          {c.common.readMore}
                          <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] transition-all duration-500 group-hover:rotate-45 group-hover:border-transparent group-hover:bg-[var(--c-orange)] group-hover:text-[var(--c-ink)]"><ArrowUpRight size={16} /></span>
                        </span>
                      </div>
                    </TLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}
      <Method t={c.method} />
      <Faq t={c.faq} />
      <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: c.nav.services, path: href(locale, 'services') }])} />
    </>
  );
}
