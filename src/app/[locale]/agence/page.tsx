import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent, getSettings } from '@/lib/content';
import { href, isLocale } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { Method, PageHero, Team, Why } from '@/components/sections/Sections';
import { Picture } from '@/components/ui/Picture';
import { JsonLd } from '@/components/ui/JsonLd';
import { Logo } from '@/components/brand/Logo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(await getContent(locale), locale, 'agency', 'agency', { image: '/images/brand/idea-bulb-wide-1600.webp' });
}

export default async function AgencyPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [c, s] = await Promise.all([getContent(locale), getSettings()]);
  const p = c.agencyPage;
  const fr = locale === 'fr';
  const identity: Array<[string, string]> = [
    [fr ? 'Raison sociale' : 'Company name', s.brand.legalName],
    [fr ? 'Slogan' : 'Tagline', `${s.brand.slogan} ${fr ? '(cette fois, faites-vous écouter)' : '(this time, make yourself heard)'}`],
    [fr ? 'Adresse' : 'Address', `${s.address.district} — ${s.address.street}, ${s.address.city}, ${s.address.country}`],
    ['E-mail', s.contact.email],
    [fr ? 'Téléphone' : 'Phone', `${s.contact.phonePrimary} / ${s.contact.phoneSecondary}`],
    [fr ? 'Registre du commerce' : 'Trade register', s.legal.rccm],
    [fr ? 'Numéro contribuable (NIU)' : 'Taxpayer number (NIU)', s.legal.niu],
    [fr ? 'Régime d’imposition' : 'Tax regime', s.legal.taxRegime],
  ];

  return (
    <>
      <PageHero kicker={p.kicker} title={p.title} lead={p.lead} image="/images/brand/idea-bulb-wide"
        crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: c.nav.agency }]} />

      <section className="section theme-light">
        <div className="wrap grid gap-16 lg:grid-cols-2">
          <div className="space-y-14">
            <div>
              <p className="kicker" data-reveal>{p.preambleTitle}</p>
              <p className="mt-6 font-display text-[clamp(1.35rem,1.1rem+.9vw,2rem)] leading-[1.35]" data-reveal>{p.preamble}</p>
            </div>
            <div>
              <p className="kicker" data-reveal>{p.passionTitle}</p>
              <p className="mt-6 text-lg text-[var(--muted)]" data-reveal>{p.passion}</p>
            </div>
          </div>
          <div className="relative">
            <div className="sticky top-28 aspect-[4/5] overflow-hidden rounded-[2rem]" data-img-reveal>
              <Picture src="/images/brand/idea-bulb" alt={p.passionTitle} className="h-full w-full" sizes="(min-width:1024px) 50vw, 100vw" />
            </div>
          </div>
        </div>
      </section>

      <section className="section theme-dark">
        <div className="wrap">
          <p className="kicker" data-reveal>{p.timelineTitle}</p>
          <ol className="relative mt-14 border-l border-[var(--line)] pl-8 md:pl-14">
            {p.timeline.map((item, i) => (
              <li key={i} className="group relative pb-14 last:pb-0" data-reveal>
                <span className="absolute -left-[calc(2rem+7px)] top-4 h-3.5 w-3.5 rotate-45 md:-left-[calc(3.5rem+7px)]" style={{ background: ['var(--c-orange)', 'var(--c-red)', 'var(--c-blue)', 'var(--c-navy)'][i % 4] }} />
                <p className="stat-num !text-[clamp(3rem,2rem+4vw,6rem)] transition-colors duration-500 group-hover:text-[var(--c-orange)]">{item.year}</p>
                <p className="mt-3 max-w-2xl text-lg text-[var(--muted)]">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-tight theme-light">
        <div className="wrap">
          <p className="kicker" data-reveal>{p.valuesTitle}</p>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger>
            {p.values.map((v, i) => (
              <li key={v.title} className="card card-hover p-8">
                <span className="block h-10 w-10" style={{ background: ['var(--c-orange)', 'var(--c-red)', 'var(--c-blue)', 'var(--c-navy)'][i % 4], clipPath: 'polygon(0 0, 100% 30%, 70% 100%, 0 75%)' }} />
                <h3 className="h3 mt-8">{v.title}</h3>
                <p className="mt-3 text-[var(--muted)]">{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Method t={c.method} />
      <Why t={c.why} />
      <Team t={c.team} />

      <section className="section-tight theme-dark">
        <div className="wrap grid items-center gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="mx-auto w-full max-w-sm" data-reveal="scale"><Logo variant="full" sloganColor="var(--fg)" /></div>
          <div>
            <p className="kicker" data-reveal>{p.identityTitle}</p>
            <dl className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]" data-reveal>
              {identity.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr]">
                  <dt className="text-sm text-[var(--muted)]">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
      <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: c.nav.agency, path: href(locale, 'agency') }])} />
    </>
  );
}
