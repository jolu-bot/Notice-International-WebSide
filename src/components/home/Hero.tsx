'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Content } from '@/content/fr';
import { HeroCanvas } from '../fx/HeroCanvas';
import { PRELOAD_EVENT } from '../fx/Preloader';
import { Btn } from '../fx/TLink';

type Props = { t: Content['hero']; common: Content['common']; appointmentHref: string; workHref: string };

export function Hero({ t, common, appointmentHref, workHref }: Props) {
  const root = useRef<HTMLElement>(null);
  const verbRef = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  // Entrée chorégraphiée, déclenchée à la fin du préchargeur
  useEffect(() => {
    const el = root.current!;
    const items = el.querySelectorAll('[data-hero-in]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const play = () => {
      setReady(true);
      const lines = el.querySelectorAll('.hero-line > span');
      if (reduce) { gsap.set([...items, ...lines], { autoAlpha: 1 }); return; }
      const tl = gsap.timeline({ delay: 0.15 });
      tl.fromTo(lines, { yPercent: 115, rotate: 3, autoAlpha: 1 }, { yPercent: 0, rotate: 0, duration: 1.5, ease: 'expo.out', stagger: 0.12 }, 0)
        .fromTo(items, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 }, 0.2);
    };
    const w = window as unknown as { __niReady?: boolean };
    if (w.__niReady || document.documentElement.classList.contains('pl-done')) play();
    else { window.addEventListener(PRELOAD_EVENT, play, { once: true }); return () => window.removeEventListener(PRELOAD_EVENT, play); }
  }, []);

  // Les verbes stratégiques défilent comme un tableau d'affichage
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      const el = verbRef.current;
      if (!el) return;
      gsap.to(el, { yPercent: -110, autoAlpha: 0, duration: 0.45, ease: 'power3.in', onComplete: () => {
        setIndex((i) => (i + 1) % t.verbs.length);
        gsap.fromTo(el, { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out' });
      } });
    }, 2600);
    return () => window.clearInterval(id);
  }, [ready, t.verbs.length]);

  return (
    <section ref={root} className="hero theme-dark" aria-label={t.titleB}>
      <div className="hero-glow" aria-hidden />
      <HeroCanvas className="hero-canvas" />

      {/* Sceau rotatif « 7X » */}
      <div className="pointer-events-none absolute right-[var(--gutter)] top-[calc(var(--header-h)+1.5rem)] hidden h-32 w-32 md:block" data-hero-in aria-hidden>
        <svg viewBox="0 0 120 120" className="h-full w-full animate-[spin_18s_linear_infinite]">
          <defs><path id="seal" d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0" /></defs>
          <text fill="currentColor" style={{ fontSize: 10.5, letterSpacing: 3.2, fontWeight: 700, textTransform: 'uppercase' }}>
            <textPath href="#seal">{t.badgeText} · {t.badgeText} · </textPath>
          </text>
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-3xl italic-accent grad-text">{t.badge}</span>
      </div>

      <div className="wrap relative z-10 w-full pb-[clamp(2.5rem,7vh,5rem)] pt-[52vh] md:pt-40">
        <p className="kicker" data-hero-in>{t.kicker}</p>
        <h1 className="display mt-6 max-w-[11ch] md:max-w-[12ch]">
          <span className="hero-line line-mask"><span>{t.titleA}</span></span>
          <span className="hero-line line-mask"><span className="italic-accent grad-text pr-[.08em]">{t.titleB}</span></span>
        </h1>
        <p className="mt-8 flex flex-wrap items-baseline gap-x-3 font-display text-[clamp(1.35rem,1rem+1.4vw,2.2rem)] leading-tight" data-hero-in>
          <span className="text-[var(--muted)]">{t.verbsIntro}</span>
          <span className="verb-rotator" aria-live="polite">
            <span ref={verbRef} className="italic-accent text-[var(--c-orange)]">{t.verbs[index]}</span>
          </span>
        </p>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="lead" data-hero-in>{t.lead}</p>
            <div className="mt-9 flex flex-wrap gap-3" data-hero-in>
              <Btn href={appointmentHref}>{t.ctaPrimary}</Btn>
              <Btn href={workHref} variant="ghost">{t.ctaSecondary}</Btn>
            </div>
          </div>
          <div className="hidden items-center gap-5 text-xs font-bold uppercase tracking-[.2em] text-[var(--muted)] lg:flex" data-hero-in>
            <span>{t.interact}</span>
            <span className="scroll-cue" aria-hidden />
            <span>{common.scroll}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
