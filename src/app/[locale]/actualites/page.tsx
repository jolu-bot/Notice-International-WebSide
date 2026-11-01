import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { getPosts } from '@/lib/posts';
import { href, isLocale } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { PageHero } from '@/components/sections/Sections';
import { NewsGrid } from '@/components/sections/NewsGrid';
import { Btn } from '@/components/fx/TLink';
import { JsonLd } from '@/components/ui/JsonLd';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(await getContent(locale), locale, 'news', 'news');
}

export default async function NewsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [c, posts] = await Promise.all([getContent(locale), getPosts(locale)]);
  const t = c.newsPage;
  return (
    <>
      <PageHero kicker={t.kicker} title={t.title} lead={t.lead}
        crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: c.nav.news }]} />
      <section className="section theme-light">
        <div className="wrap">
          {posts.length ? <NewsGrid posts={posts} t={t} locale={locale} /> : (
            <div className="mx-auto max-w-xl text-center" data-reveal>
              <p className="lead mx-auto">{t.empty}</p>
              <div className="mt-8 flex justify-center"><Btn href={href(locale, 'work')}>{c.nav.work}</Btn></div>
            </div>
          )}
        </div>
      </section>
      <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: c.nav.news, path: href(locale, 'news') }])} />
    </>
  );
}
