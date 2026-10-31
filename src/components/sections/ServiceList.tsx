'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Content } from '@/content/fr';
import { href, type Locale } from '@/lib/i18n';
import { TLink } from '../fx/TLink';
import { imgUrl } from '../ui/Picture';
import { ArrowRight } from '../ui/Icons';

type Item = Content['services']['items'][number];

/** Liste des expertises : une image flotte et suit le curseur au survol de chaque ligne. */
export function ServiceList({ items, locale, labelImmo }: { items: Item[]; locale: Locale; labelImmo: string }) {
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = preview.current;
    if (!el || !window.matchMedia('(pointer: fine)').matches) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    const rTo = gsap.quickTo(el, 'rotate', { duration: 0.8, ease: 'power3' });
    let lastX = 0;
    const move = (e: PointerEvent) => { xTo(e.clientX + 30); yTo(e.clientY - 190); rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6)); lastX = e.clientX; };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <div className="relative" onPointerLeave={() => setActive(null)}>
      <ol>
        {items.map((s, i) => (
          <li key={s.slug} data-reveal>
            <TLink href={href(locale, 'services', s.slug)} className="service-row group" onPointerEnter={() => setActive(i)}>
              <span className="num text-sm text-[var(--muted)]">{String(i + 1).padStart(2, '0')}</span>
              <span className="sr-title block">
                <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="h3 !text-[clamp(1.6rem,1.1rem+2vw,3.2rem)] transition-colors duration-500 group-hover:text-[var(--c-orange)]">{s.title}</span>
                  {s.universe === 'immo' && <span className="tag">{labelImmo}</span>}
                </span>
                <span className="mt-1 block text-[var(--muted)]">{s.short}</span>
              </span>
              <span className="sr-arrow"><ArrowRight size={20} /></span>
            </TLink>
          </li>
        ))}
      </ol>
      <div ref={preview} className={`service-preview hidden lg:block ${active !== null ? 'is-on' : ''}`} aria-hidden>
        {items.map((s, i) => (
          <img key={s.slug} src={imgUrl(s.image, 800)} alt="" className="absolute inset-0 transition-opacity duration-500" style={{ opacity: active === i ? 1 : 0 }} loading="lazy" />
        ))}
      </div>
    </div>
  );
}
