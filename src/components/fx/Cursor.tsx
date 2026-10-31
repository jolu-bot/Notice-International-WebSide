'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/** Curseur sur mesure : un point et un anneau qui s'agrandit, avec étiquette contextuelle (data-cursor="Voir"). */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = root.current!;
    document.documentElement.classList.add('has-cursor');
    el.style.display = 'block';
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.08 });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.08 });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3' });

    const move = (e: PointerEvent) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); el.classList.remove('is-hidden'); };
    const over = (e: Event) => {
      const t = e.target as HTMLElement;
      const labelled = t.closest<HTMLElement>('[data-cursor]');
      const interactive = t.closest('a, button, [role="button"], label, summary, select, input[type="checkbox"]');
      el.classList.toggle('is-label', !!labelled);
      el.classList.toggle('is-hover', !labelled && !!interactive);
      setLabel(labelled?.dataset.cursor || '');
    };
    const leave = () => el.classList.add('is-hidden');
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div ref={root} className="cursor is-hidden" style={{ display: 'none' }} aria-hidden>
      <div ref={ring} className="cursor-ring fixed left-0 top-0"><span className="cursor-label">{label}</span></div>
      <div ref={dot} className="cursor-dot fixed left-0 top-0" />
    </div>
  );
}
