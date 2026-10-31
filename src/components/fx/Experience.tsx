'use client';

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { Cursor } from './Cursor';

gsap.registerPlugin(ScrollTrigger, SplitText);

type Ctx = { navigate: (href: string) => void; scrollTo: (target: string | number | HTMLElement) => void };
const ExperienceContext = createContext<Ctx>({ navigate: () => {}, scrollTo: () => {} });
export const useExperience = () => useContext(ExperienceContext);

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────────────────────────────────────────────────────────────
   Animateur : lit les attributs data-* du DOM rendu côté serveur
   et installe les animations au défilement. Rejoué à chaque page.
   ───────────────────────────────────────────────────────────────────── */
function runAnimator(root: HTMLElement): () => void {
  const reduce = reducedMotion();
  const mm = gsap.matchMedia();
  const splits: SplitText[] = [];
  const cleanups: Array<() => void> = [];

  const ctx = gsap.context(() => {
    const show = (els: Element[] | NodeListOf<Element>) => gsap.set(els, { autoAlpha: 1, clearProps: 'transform' });

    // Titres découpés en lignes masquées
    root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
      if (reduce) return show([el]);
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
        onSplit(self) {
          gsap.set(el, { autoAlpha: 1 });
          return gsap.from(self.lines, {
            yPercent: 112, rotate: 2.5, duration: 1.25, ease: 'expo.out', stagger: 0.09,
            delay: Number(el.dataset.delay || 0),
            scrollTrigger: el.dataset.split === 'now' ? undefined : { trigger: el, start: 'top 88%', once: true },
          });
        },
      });
      splits.push(split);
    });

    // Révélations génériques
    root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      if (reduce) return show([el]);
      const kind = el.dataset.reveal || 'up';
      const from: gsap.TweenVars =
        kind === 'fade' ? { autoAlpha: 0 } :
        kind === 'scale' ? { autoAlpha: 0, scale: 0.92 } :
        kind === 'left' ? { autoAlpha: 0, x: -60 } :
        kind === 'right' ? { autoAlpha: 0, x: 60 } :
        { autoAlpha: 0, y: 60 };
      gsap.fromTo(el, from, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 1.3, ease: 'expo.out', delay: Number(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });

    // Groupes en cascade
    root.querySelectorAll<HTMLElement>('[data-stagger]').forEach((el) => {
      const items = Array.from(el.children);
      if (reduce) return show(items);
      gsap.fromTo(items, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: Number(el.dataset.stagger) || 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    // Images dévoilées par un rideau
    root.querySelectorAll<HTMLElement>('[data-img-reveal]').forEach((el) => {
      if (reduce) return show([el]);
      const img = el.querySelector('img');
      gsap.set(el, { autoAlpha: 1 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' });
      if (img) tl.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.1);
    });

    // Parallaxe
    if (!reduce) root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
      const amount = Number(el.dataset.parallax) || 0.15;
      gsap.fromTo(el, { yPercent: -amount * 50 }, { yPercent: amount * 50, ease: 'none',
        scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Compteurs
    root.querySelectorAll<HTMLElement>('[data-counter]').forEach((el) => {
      const target = Number(el.dataset.counter);
      if (!Number.isFinite(target)) return;
      if (reduce) { el.textContent = String(target); return; }
      const obj = { v: 0 };
      gsap.to(obj, { v: target, duration: 2.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = String(Math.round(obj.v)); } });
    });

    // Manifeste : les mots s'allument au fil du défilement
    root.querySelectorAll<HTMLElement>('[data-scrub-words]').forEach((el) => {
      const split = SplitText.create(el, { type: 'words', wordsClass: 'scrub-word' });
      splits.push(split);
      gsap.set(el, { autoAlpha: 1 });
      if (reduce) return;
      gsap.fromTo(split.words, { opacity: 0.12 }, { opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 45%', scrub: 0.6 } });
    });

    // Tracés SVG dessinés au défilement
    root.querySelectorAll<SVGPathElement>('[data-draw]').forEach((path) => {
      const len = path.getTotalLength();
      if (reduce) return;
      gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: path.closest('[data-draw-root]') || path, start: 'top 70%', end: 'bottom 60%', scrub: 0.8 } });
    });

    // Défilement horizontal épinglé (bureau)
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      root.querySelectorAll<HTMLElement>('[data-hscroll]').forEach((wrap) => {
        const track = wrap.querySelector<HTMLElement>('[data-hscroll-track]');
        if (!track) return;
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 80);
        const tween = gsap.to(track, { x: () => -distance(), ease: 'none',
          scrollTrigger: { trigger: wrap, start: 'top top', end: () => `+=${distance()}`, scrub: 0.6, pin: true, invalidateOnRefresh: true, anticipatePin: 1 } });
        track.querySelectorAll<HTMLElement>('[data-hscroll-item]').forEach((card) => {
          gsap.fromTo(card, { rotate: 4, y: 40 }, { rotate: 0, y: 0, ease: 'none',
            scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'left 40%', scrub: true } });
        });
      });
    });

    // Bandeaux défilants : inclinaison selon la vitesse
    if (!reduce) {
      const skewEls = root.querySelectorAll<HTMLElement>('[data-skew]');
      if (skewEls.length) {
        const setters = Array.from(skewEls).map((el) => gsap.quickTo(el, 'skewX', { duration: 0.6, ease: 'power3' }));
        ScrollTrigger.create({ trigger: root, start: 0, end: 'max', onUpdate: (self) => {
          const v = gsap.utils.clamp(-12, 12, self.getVelocity() / -250);
          setters.forEach((s) => s(v));
        } });
      }
    }
  }, root);

  // Boutons magnétiques
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    root.ownerDocument.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const strength = Number(el.dataset.magnetic) || 0.35;
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      };
      const leave = () => { xTo(0); yTo(0); };
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      cleanups.push(() => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); gsap.set(el, { x: 0, y: 0 }); });
    });
  }

  const refresh = () => ScrollTrigger.refresh();
  const t = window.setTimeout(refresh, 300);
  document.fonts?.ready.then(refresh).catch(() => {});

  return () => {
    window.clearTimeout(t);
    cleanups.forEach((fn) => fn());
    splits.forEach((s) => s.revert());
    mm.revert();
    ctx.revert();
  };
}

export function Experience({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const curtainRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const pending = useRef(false);
  const safety = useRef<number | undefined>(undefined);

  // Défilement fluide (Lenis) synchronisé avec GSAP
  useEffect(() => {
    if (reducedMotion()) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, touchMultiplier: 1.4 });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); lenisRef.current = null; };
  }, []);

  const uncover = useCallback(() => {
    const el = curtainRef.current;
    if (!el) return;
    window.clearTimeout(safety.current);
    gsap.to(el.children, { scaleY: 0, transformOrigin: 'top', duration: 0.75, ease: 'expo.inOut', stagger: 0.055, delay: 0.05,
      onComplete: () => { gsap.set(el, { display: 'none' }); } });
  }, []);

  const navigate = useCallback((href: string) => {
    const el = curtainRef.current;
    if (!el || reducedMotion()) { router.push(href); return; }
    pending.current = true;
    lenisRef.current?.stop();
    gsap.set(el, { display: 'flex' });
    gsap.fromTo(el.children, { scaleY: 0, transformOrigin: 'bottom' }, { scaleY: 1, duration: 0.6, ease: 'expo.inOut', stagger: 0.055,
      onComplete: () => {
        router.push(href);
        safety.current = window.setTimeout(() => { pending.current = false; lenisRef.current?.start(); uncover(); }, 5000);
      } });
  }, [router, uncover]);

  const scrollTo = useCallback((target: string | number | HTMLElement) => {
    if (lenisRef.current) lenisRef.current.scrollTo(target as never, { offset: -80, duration: 1.4 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
    else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // À chaque page : retour en haut, levée du rideau, animations
  useEffect(() => {
    if (!window.location.hash) { lenisRef.current?.scrollTo(0, { immediate: true }); window.scrollTo(0, 0); }
    if (pending.current) { pending.current = false; lenisRef.current?.start(); uncover(); }
    const main = document.getElementById('main');
    if (!main) return;
    const cleanup = runAnimator(main);
    if (window.location.hash) window.setTimeout(() => scrollTo(window.location.hash), 400);
    return cleanup;
  }, [pathname, uncover, scrollTo]);

  return (
    <ExperienceContext.Provider value={{ navigate, scrollTo }}>
      {children}
      <div ref={curtainRef} className="curtain" style={{ display: 'none' }} aria-hidden>
        <i /><i /><i /><i /><i />
      </div>
      <Cursor />
    </ExperienceContext.Provider>
  );
}
