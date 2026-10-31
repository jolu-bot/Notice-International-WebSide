'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Content } from '@/content/fr';
import { Close, Play } from '../ui/Icons';

/** Film de marque : boucle muette en aperçu, lecteur plein écran avec le son au clic. */
export function Showreel({ t }: { t: Content['showreel'] }) {
  const [open, setOpen] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const modal = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  // Le cadre s'agrandit au défilement
  useEffect(() => {
    const el = frame.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tw = gsap.fromTo(el, { clipPath: 'inset(12% 14% 12% 14% round 2rem)' }, { clipPath: 'inset(0% 0% 0% 0% round 2rem)', ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 20%', scrub: 0.6 } });
    return () => { tw.scrollTrigger?.kill(); tw.kill(); };
  }, []);

  useEffect(() => {
    if (!open || !modal.current) return;
    gsap.fromTo(modal.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 });
    gsap.fromTo(modal.current.querySelector('video'), { scale: 0.85, y: 40 }, { scale: 1, y: 0, duration: 1, ease: 'expo.out' });
    video.current?.play().catch(() => {});
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; };
  }, [open]);

  return (
    <section className="section theme-dark" aria-label={t.label}>
      <div className="wrap">
        <div ref={frame} className="relative aspect-[4/5] overflow-hidden rounded-[2rem] sm:aspect-video">
          <video className="absolute inset-0 h-full w-full object-cover" src="/media/showreel-loop.mp4" poster="/media/showreel-poster.webp" autoPlay muted loop playsInline preload="metadata" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(7_10_23/.9)] via-[rgb(7_10_23/.25)] to-[rgb(7_10_23/.35)]" />
          <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-12">
            <p className="kicker !text-white/80">{t.label}</p>
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <h2 className="h1 max-w-[12ch] text-white">{t.title}</h2>
                <p className="mt-4 font-display text-xl italic-accent text-[var(--c-orange)]">{t.words}</p>
                <p className="mt-3 max-w-md text-white/70">{t.text}</p>
              </div>
              <button onClick={() => setOpen(true)} className="group relative grid h-32 w-32 place-items-center rounded-full bg-[var(--c-cream)] text-[var(--c-ink)] md:h-40 md:w-40" data-magnetic="0.5" data-cursor={t.play} aria-label={t.play}>
                <span className="absolute inset-0 rounded-full border border-[var(--c-cream)] opacity-60 transition-transform duration-1000 group-hover:scale-125" />
                <Play size={34} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div ref={modal} className="fixed inset-0 z-[130] grid place-items-center bg-[rgb(7_10_23/.97)] p-4" role="dialog" aria-modal="true" aria-label={t.title} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <button className="lb-btn absolute right-5 top-5" onClick={() => setOpen(false)} aria-label="Fermer / Close"><Close size={22} /></button>
          <video ref={video} className="max-h-[86vh] w-full max-w-6xl rounded-2xl" src="/media/showreel.mp4" poster="/media/showreel-poster.webp" controls playsInline preload="auto" />
        </div>
      )}
    </section>
  );
}
