'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Logo } from '../brand/Logo';

export const PRELOAD_EVENT = 'ni:ready';

/**
 * Ouverture : les facettes de la bouche s'assemblent depuis le chaos, le compteur remonte
 * le temps de 2000 à aujourd'hui, puis la bouche s'ouvre et révèle le site.
 * Affiché une fois par session ; ignoré si l'utilisateur préfère réduire les animations.
 */
export function Preloader({ words, since = 2000 }: { words: string; since?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const finish = () => {
      try { sessionStorage.setItem('ni-pl', '1'); } catch {}
      html.classList.add('pl-done');
      (window as unknown as { __niReady?: boolean }).__niReady = true;
      window.dispatchEvent(new Event(PRELOAD_EVENT));
      setDone(true);
    };
    if (html.classList.contains('pl-done') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }

    const el = root.current!;
    const facets = el.querySelectorAll('[data-facet]');
    const counter = el.querySelector('.pl-count')!;
    const year = new Date().getFullYear();
    const obj = { y: since };
    const tl = gsap.timeline({ onComplete: finish });
    tl.from(facets, {
      x: () => gsap.utils.random(-900, 900), y: () => gsap.utils.random(-700, 700), rotate: () => gsap.utils.random(-220, 220),
      scale: () => gsap.utils.random(0.2, 1.6), opacity: 0, duration: 1.5, ease: 'expo.out', stagger: { each: 0.04, from: 'random' },
    })
      .from(el.querySelector('[data-mouth]'), { scaleY: 0, transformOrigin: '50% 50%', duration: 0.9, ease: 'expo.out' }, 0.5)
      .from(el.querySelector('[data-mark]'), { scale: 0, transformOrigin: '50% 50%', rotate: -30, duration: 1, ease: 'back.out(2)' }, 0.9)
      .to(obj, { y: year, duration: 1.8, ease: 'power3.inOut', onUpdate: () => { counter.textContent = String(Math.round(obj.y)); } }, 0.1)
      .from(el.querySelector('.pl-words'), { opacity: 0, y: 12, duration: 0.8 }, 0.3)
      .to(el.querySelectorAll('[data-facet]'), { x: () => gsap.utils.random(-60, 60), y: () => gsap.utils.random(-60, 60), duration: 0.35, ease: 'power2.out', stagger: 0.01, yoyo: true, repeat: 1 }, 2)
      .to(el.querySelector('.pl-logo'), { scale: 28, duration: 1.2, ease: 'expo.in' }, 2.5)
      .to(el, { opacity: 0, duration: 0.5, ease: 'power1.out' }, 3.35);
    return () => { tl.kill(); };
  }, [since]);

  if (done) return null;
  return (
    <div ref={root} className="preloader" aria-hidden>
      <div className="pl-logo w-[min(46vw,280px)]">
        <Logo />
      </div>
      <div className="pl-words">{words}</div>
      <div className="pl-count num">{since}</div>
    </div>
  );
}
