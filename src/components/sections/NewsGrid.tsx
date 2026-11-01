'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Content } from '@/content/fr';
import type { Post } from '@/lib/posts';
import type { Locale } from '@/lib/i18n';
import { NewsCard } from './NewsCard';

/** Liste des actualités : la plus récente en vedette, puis une grille filtrable par catégorie. */
export function NewsGrid({ posts, t, locale }: { posts: Post[]; t: Content['newsPage']; locale: Locale }) {
  const [filter, setFilter] = useState<string>('all');
  const grid = useRef<HTMLDivElement>(null);
  const cats = ['all', ...Array.from(new Set(posts.map((p) => p.category)))];
  const visible = posts.filter((p) => filter === 'all' || p.category === filter);
  const [first, ...rest] = visible;

  useLayoutEffect(() => {
    if (!grid.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(grid.current.children, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06 });
  }, [filter]);

  return (
    <div>
      {cats.length > 2 && (
        <div className="mb-14 flex flex-wrap gap-2" role="group" aria-label={t.kicker}>
          {cats.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>
              {c === 'all' ? t.all : t.categories[c as keyof typeof t.categories]}
            </button>
          ))}
        </div>
      )}
      <div ref={grid} className="space-y-20">
        {first && <NewsCard post={first} t={t} locale={locale} featured />}
        {rest.length > 0 && (
          <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => <NewsCard key={p.slug} post={p} t={t} locale={locale} />)}
          </div>
        )}
      </div>
    </div>
  );
}
