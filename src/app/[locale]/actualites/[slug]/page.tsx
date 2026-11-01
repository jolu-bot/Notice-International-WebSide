import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent, getSettings } from '@/lib/content';
import { coverUrl, getPost, getPosts } from '@/lib/posts';
import { href, isLocale } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { PageHero } from '@/components/sections/Sections';
import { NewsCard, formatDate } from '@/components/sections/NewsCard';
import { ShareButtons } from '@/components/sections/ShareButtons';
import { Btn, TLink } from '@/components/fx/TLink';
import { Markdown } from '@/components/ui/Markdown';
import { ArrowLeft } from '@/components/ui/Icons';
import { JsonLd } from '@/components/ui/JsonLd';

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const [c, post] = await Promise.all([getContent(locale), getPost(locale, slug)]);
  if (!post) return {};
  const meta = pageMetadata(c, locale, 'news', 'news', { sub: slug, title: post.title, description: post.excerpt || undefined, image: post.cover ? coverUrl(post.cover) : undefined });
  return { ...meta, openGraph: { ...meta.openGraph, type: 'article', publishedTime: post.date, modifiedTime: post.updated } };
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [c, s, post, all] = await Promise.all([getContent(locale), getSettings(), getPost(locale, slug), getPosts(locale)]);
  if (!post) notFound();
  const t = c.newsPage;
  const url = `${SITE_URL}${href(locale, 'news', slug)}`;
  const related = [...all.filter((p) => p.slug !== slug && p.category === post.category), ...all.filter((p) => p.slug !== slug && p.category !== post.category)].slice(0, 3);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.updated,
    inLanguage: locale,
    mainEntityOfPage: url,
    url,
    image: post.cover ? [`${post.cover.startsWith('http') ? '' : SITE_URL}${coverUrl(post.cover)}`] : undefined,
    author: { '@type': 'Organization', name: s.brand.name, '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    articleSection: t.categories[post.category],
    wordCount: post.body.split(/\s+/).length,
  };

  return (
    <>
      <PageHero kicker={`${t.categories[post.category]} · ${formatDate(post.date, locale)}`} title={post.title} lead={post.excerpt || undefined} image={post.cover || undefined}
        crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: c.nav.news, href: href(locale, 'news') }, { label: t.categories[post.category] }]} />

      <section className="section theme-light">
        <div className="wrap grid gap-14 lg:grid-cols-[1fr_2.2fr]">
          <aside className="h-fit space-y-8 border-y border-[var(--line)] py-6 lg:sticky lg:top-32" data-reveal>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">{t.published}</p>
              <p className="mt-1 font-semibold"><time dateTime={post.date}>{formatDate(post.date, locale)}</time></p>
              <p className="mt-1 text-sm text-[var(--muted)]">{post.minutes} {t.minutes}</p>
            </div>
            <ShareButtons url={url} title={post.title} label={t.share} copy={t.copy} copied={t.copied} />
            <TLink href={href(locale, 'news')} className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={16} /> {t.back}</TLink>
          </aside>
          <article data-reveal>
            <Markdown source={post.body} className="prose-ni text-lg" />
          </article>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section theme-dark">
          <div className="wrap">
            <p className="kicker" data-reveal>{t.related}</p>
            <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3" data-stagger>
              {related.map((p) => <NewsCard key={p.slug} post={p} t={t} locale={locale} />)}
            </div>
          </div>
        </section>
      )}

      <section className="section-tight theme-light text-center">
        <div className="wrap">
          <p className="h2 mx-auto max-w-[16ch]" data-split>{t.ctaTitle}</p>
          <p className="lead mx-auto mt-6" data-reveal>{t.ctaText}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4" data-reveal>
            <Btn href={href(locale, 'appointment')}>{c.nav.cta}</Btn>
            <Btn href={href(locale, 'quote')} variant="ghost">{c.nav.quote}</Btn>
          </div>
        </div>
      </section>

      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: c.nav.news, path: href(locale, 'news') }, { name: post.title, path: href(locale, 'news', slug) }])} />
    </>
  );
}
