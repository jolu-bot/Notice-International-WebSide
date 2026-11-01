import type { Content } from '@/content/fr';
import type { Post } from '@/lib/posts';
import { href, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { TLink } from '../fx/TLink';
import { Picture } from '../ui/Picture';
import { ArrowUpRight } from '../ui/Icons';

export function formatDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Douala' });
}

/** Carte d'article : image qui se resserre au survol, catégorie, date, temps de lecture. */
export function NewsCard({ post, t, locale, featured, className }: { post: Post; t: Content['newsPage']; locale: Locale; featured?: boolean; className?: string }) {
  return (
    <TLink href={href(locale, 'news', post.slug)} className={cn('group flex flex-col', featured && 'lg:grid lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-12', className)} data-cursor={t.readMore.split(' ')[0]}>
      <div className={cn('img-zoom relative overflow-hidden rounded-[1.6rem] bg-[var(--card)]', featured ? 'aspect-[16/10]' : 'aspect-[4/3]')}>
        {post.cover ? (
          <Picture src={post.cover} alt={post.title} className="h-full w-full" sizes={featured ? '(min-width:1024px) 58vw, 100vw' : '(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw'} />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[var(--mosaic)] bg-[length:240%_100%] opacity-80" aria-hidden />
        )}
        <span className="absolute left-5 top-5 rounded-full bg-[rgb(7_10_23/.7)] px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{t.categories[post.category]}</span>
        <span className="absolute bottom-5 right-5 grid h-14 w-14 scale-0 place-items-center rounded-full bg-[var(--c-orange)] text-[var(--c-ink)] transition-transform duration-700 group-hover:scale-100"><ArrowUpRight size={22} /></span>
      </div>
      <div className={cn('mt-6', featured && 'lg:mt-0')}>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">
          <time dateTime={post.date}>{formatDate(post.date, locale)}</time> · {post.minutes} {t.minutes}
        </p>
        <h3 className={cn('mt-3 transition-colors duration-500 group-hover:text-[var(--c-orange)]', featured ? 'h2' : 'h3')}>{post.title}</h3>
        {post.excerpt && <p className={cn('mt-4 text-[var(--muted)]', featured ? 'lead' : 'line-clamp-3')}>{post.excerpt}</p>}
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold">{t.readMore} <ArrowUpRight size={16} /></span>
      </div>
    </TLink>
  );
}
