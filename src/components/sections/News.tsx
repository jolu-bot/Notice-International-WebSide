import type { Content } from '@/content/fr';
import type { Post } from '@/lib/posts';
import { href, type Locale } from '@/lib/i18n';
import { Btn } from '../fx/TLink';
import { SectionHead } from './Sections';
import { NewsCard } from './NewsCard';

/** Accueil : les trois dernières actualités (masqué tant qu'aucune n'est publiée). */
export function LatestNews({ posts, t, locale, seeAll }: { posts: Post[]; t: Content['newsPage']; locale: Locale; seeAll: string }) {
  if (!posts.length) return null;
  return (
    <section className="section theme-light">
      <div className="wrap">
        <SectionHead label={t.latestLabel} title={t.latestTitle}>
          <Btn href={href(locale, 'news')} variant="ghost" size="sm">{seeAll}</Btn>
        </SectionHead>
        <div className="mt-16 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3" data-stagger>
          {posts.map((p) => <NewsCard key={p.slug} post={p} t={t} locale={locale} />)}
        </div>
      </div>
    </section>
  );
}
