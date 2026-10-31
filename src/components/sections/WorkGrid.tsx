'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import type { Content } from '@/content/fr';
import { href, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { TLink } from '../fx/TLink';
import { imgUrl } from '../ui/Picture';
import { ArrowUpRight } from '../ui/Icons';

gsap.registerPlugin(Flip);

/** Grille des réalisations filtrable, avec réorganisation animée (FLIP). */
export function WorkGrid({ t, locale, cta }: { t: Content['work']; locale: Locale; cta: string }) {
  const [filter, setFilter] = useState('all');
  const grid = useRef<HTMLUListElement>(null);
  const state = useRef<Flip.FlipState | null>(null);
  const cats = ['all', ...Array.from(new Set(t.items.map((p) => p.category)))];

  const choose = (c: string) => {
    if (grid.current) state.current = Flip.getState(grid.current.children);
    setFilter(c);
  };

  useLayoutEffect(() => {
    if (!state.current || !grid.current) return;
    Flip.from(state.current, {
      duration: 0.9, ease: 'expo.inOut', absolute: true, stagger: 0.03,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'expo.out' }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.5 }),
    });
    state.current = null;
  }, [filter]);

  const visible = t.items.filter((p) => filter === 'all' || p.category === filter);
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t.label}>
        {cats.map((c) => (
          <button key={c} className="chip" aria-pressed={filter === c} onClick={() => choose(c)}>
            {t.filters[c as keyof typeof t.filters] ?? c}
            <span className="num text-xs opacity-60">{c === 'all' ? t.items.length : t.items.filter((p) => p.category === c).length}</span>
          </button>
        ))}
      </div>
      <ul ref={grid} className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((p, i) => (
          <li key={p.slug} className={cn('transition-[margin] duration-700', i % 3 === 1 && filter === 'all' && 'lg:mt-16')}>
            <TLink href={href(locale, 'work', p.slug)} className="group block" data-cursor={cta}>
              <div className="img-zoom relative aspect-[4/5] overflow-hidden rounded-[1.6rem]">
                <img src={imgUrl(p.cover, 800)} srcSet={p.cover.startsWith('/images/') ? `${imgUrl(p.cover, 800)} 800w, ${imgUrl(p.cover)} 1600w` : undefined} sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgb(7_10_23/.7)] to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                <span className="absolute bottom-5 right-5 grid h-14 w-14 scale-0 place-items-center rounded-full bg-[var(--c-orange)] text-[var(--c-ink)] transition-transform duration-700 group-hover:scale-100"><ArrowUpRight size={22} /></span>
                <span className="absolute left-5 top-5 rounded-full bg-[rgb(7_10_23/.65)] px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{t.filters[p.category as keyof typeof t.filters] ?? p.category}</span>
              </div>
              <p className="mt-5 text-sm font-bold uppercase tracking-[.16em] text-[var(--c-orange)]">{p.client}</p>
              <h3 className="h3 mt-2">{p.title}</h3>
              <p className="mt-2 text-[var(--muted)]">{p.summary}</p>
            </TLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
