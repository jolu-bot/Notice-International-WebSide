import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent, getSettings, yearsSince } from '@/lib/content';
import { href, isLocale } from '@/lib/i18n';
import { faqJsonLd, pageMetadata } from '@/lib/seo';
import { Hero } from '@/components/home/Hero';
import { ClientsWall, Faq, Manifesto, Method, SectionHead, Stats, Team, Universes, VerbsMarquee, Why, WorkRail } from '@/components/sections/Sections';
import { ServiceList } from '@/components/sections/ServiceList';
import { Showreel } from '@/components/sections/Showreel';
import { JsonLd } from '@/components/ui/JsonLd';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(await getContent(locale), locale, 'home', 'home');
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [c, s] = await Promise.all([getContent(locale), getSettings()]);
  const tokens = { years: yearsSince(s.brand.foundingYear), clients: c.clients.items.length };

  return (
    <>
      <Hero t={c.hero} common={c.common} appointmentHref={href(locale, 'appointment')} workHref={href(locale, 'work')} />
      <VerbsMarquee verbs={c.hero.verbs} />
      <Manifesto t={c.manifesto} />
      <Stats t={c.stats} tokens={tokens} />
      <Universes t={c.universes} locale={locale} />
      <section className="section theme-dark pt-0">
        <div className="wrap">
          <SectionHead label={c.services.label} title={c.services.title} intro={c.services.intro} />
          <div className="mt-16"><ServiceList items={c.services.items} locale={locale} labelImmo="Immo & Building" /></div>
        </div>
      </section>
      <Method t={c.method} />
      <Showreel t={c.showreel} />
      <WorkRail t={c.work} locale={locale} common={c.common} />
      <ClientsWall t={c.clients} />
      <Why t={c.why} />
      <Team t={c.team} />
      <Faq t={c.faq} />
      <JsonLd data={faqJsonLd(c.faq.items)} />
    </>
  );
}
