import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { href, isLocale } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { ClientsWall, PageHero } from '@/components/sections/Sections';
import { WorkGrid } from '@/components/sections/WorkGrid';
import { Showreel } from '@/components/sections/Showreel';
import { JsonLd } from '@/components/ui/JsonLd';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(await getContent(locale), locale, 'work', 'work', { image: '/images/work/coca-1-1600.webp' });
}

export default async function WorkPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = await getContent(locale);
  return (
    <>
      <PageHero kicker={c.work.label} title={c.work.title} lead={c.work.intro}
        crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: c.nav.work }]} />
      <section className="section theme-dark pt-0">
        <div className="wrap"><WorkGrid t={c.work} locale={locale} cta={c.common.seeProject.split(' ')[0]} /></div>
      </section>
      <Showreel t={c.showreel} />
      <ClientsWall t={c.clients} />
      <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: c.nav.work, path: href(locale, 'work') }])} />
    </>
  );
}
