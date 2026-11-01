'use client';

import { useEffect, useRef } from 'react';
import { FACETS, MARK, MOUTH, LOGO_VIEWBOX } from '../brand/logo-data';
import { PRELOAD_EVENT } from './Preloader';
import { THEME_EVENT } from './Theme';

const PALETTE: Record<string, string> = { orange: '#f39200', red: '#e2001a', navy: '#2b4fd8', blue: '#1a8fe0' };

type P = { x: number; y: number; tx: number; ty: number; vx: number; vy: number; c: string; s: number; ph: number; a: number };

/**
 * La bouche Notice International recomposée en milliers de points lumineux — clin d'œil
 * au mur de LED du film de marque. Les points fuient le curseur, la bouche émet des ondes
 * comme une voix, et un clic la fait « crier » avant qu'elle ne se recompose.
 */
export function HeroCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, raf = 0, running = true, visible = true, assembled = false;
    let particles: P[] = [];
    let center = { x: 0, y: 0, scale: 1 };
    const mouse = { x: -9999, y: -9999, active: false };
    const waves: Array<{ t: number; strength: number }> = [];
    let scatter = 0;
    let time = 0;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mobile = W < 768;
      const logoW = mobile ? Math.min(W * 0.86, 420) : Math.min(W * 0.4, H * 0.86, 760);
      const scale = logoW / LOGO_VIEWBOX.w;
      const logoH = LOGO_VIEWBOX.h * scale;
      const ox = mobile ? (W - logoW) / 2 : W - logoW - W * 0.025;
      const oy = mobile ? H * 0.1 : (H - logoH) / 2 - H * 0.04;
      center = { x: ox + logoW / 2, y: oy + logoH * 0.49, scale };

      // Échantillonnage des formes du logo sur un canevas hors écran
      const off = document.createElement('canvas');
      off.width = Math.ceil(logoW); off.height = Math.ceil(logoH);
      const o = off.getContext('2d', { willReadFrequently: true })!;
      o.scale(scale, scale);
      o.fillStyle = '#fff'; o.fill(new Path2D(MOUTH));
      FACETS.forEach((f) => { o.fillStyle = PALETTE[f.color]; o.fill(new Path2D(f.d)); });
      o.fillStyle = PALETTE.navy; o.fill(new Path2D(MARK));
      const data = o.getImageData(0, 0, off.width, off.height).data;
      // La bouche prend la couleur du texte : crème en mode sombre, encre en mode clair
      const mouthColor = getComputedStyle(canvas).getPropertyValue('--fg').trim() || '#f5efe4';
      const gap = mobile ? 7 : W > 1600 ? 7 : 6;
      const next: P[] = [];
      for (let y = 0; y < off.height; y += gap) {
        for (let x = 0; x < off.width; x += gap) {
          const i = (y * off.width + x) * 4;
          if (data[i + 3] < 200) continue;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const white = r > 230 && g > 230 && b > 230;
          if (white && (x / gap + y / gap) % 2 === 1) continue; // bouche plus aérée
          const c = white ? mouthColor : `rgb(${r},${g},${b})`;
          const prev = particles[next.length];
          next.push({
            x: prev ? prev.x : Math.random() * W, y: prev ? prev.y : Math.random() * H,
            tx: ox + x, ty: oy + y, vx: 0, vy: 0, c, s: white ? gap * 0.32 : gap * 0.46, ph: Math.random() * Math.PI * 2, a: 1,
          });
        }
      }
      particles = next;
      if (reduce) particles.forEach((p) => { p.x = p.tx; p.y = p.ty; });
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
      ctx.globalAlpha = 1;
    };

    const step = () => {
      time += 0.016;
      const spring = assembled ? 0.055 : 0.0;
      const R = Math.max(90, 150 * center.scale * 1.4);
      for (let i = waves.length - 1; i >= 0; i--) { waves[i].t += 0.016; if (waves[i].t > 2.2) waves.splice(i, 1); }
      for (const p of particles) {
        // ondes sonores émises depuis la bouche
        let wx = 0, wy = 0;
        if (waves.length) {
          const dx = p.tx - center.x, dy = p.ty - center.y;
          const d = Math.hypot(dx, dy) || 1;
          for (const w of waves) {
            const front = w.t * 420 * center.scale * 1.6;
            const k = Math.exp(-((d - front) ** 2) / 1800) * w.strength;
            wx += (dx / d) * k * 16; wy += (dy / d) * k * 16;
          }
        }
        const breathe = Math.sin(time * 1.6 + p.ph) * 0.9;
        const sx = (p.tx - center.x) * scatter * 1.6 + Math.sin(p.ph * 3) * scatter * 260;
        const sy = (p.ty - center.y) * scatter * 1.2 - scatter * 380 * (0.5 + Math.cos(p.ph) * 0.5);
        const tx = p.tx + wx + sx + breathe;
        const ty = p.ty + wy + sy + breathe * 0.6;
        p.vx += (tx - p.x) * spring;
        p.vy += (ty - p.y) * spring;
        if (mouse.active) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / R) * 7.5;
            p.vx += (dx / d) * f; p.vy += (dy / d) * f;
          }
        }
        if (!assembled) { p.vx += Math.sin(time + p.ph) * 0.05; p.vy += Math.cos(time * 0.8 + p.ph) * 0.05; }
        p.vx *= 0.82; p.vy *= 0.82;
        p.x += p.vx; p.y += p.vy;
        p.a = 1 - scatter * 0.85;
      }
    };

    const loop = () => {
      if (!running) return;
      if (visible) { step(); draw(); }
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      assembled = true;
      window.setTimeout(() => waves.push({ t: 0, strength: 1 }), 900);
    };

    build();
    if (reduce) { assembled = true; draw(); }
    else {
      loop();
      if ((window as unknown as { __niReady?: boolean }).__niReady || document.documentElement.classList.contains('pl-done')) window.setTimeout(start, 200);
      else window.addEventListener(PRELOAD_EVENT, start, { once: true });
    }

    // La bouche « parle » à intervalle régulier
    const speak = window.setInterval(() => { if (visible && assembled && !reduce) waves.push({ t: 0, strength: 0.55 + Math.random() * 0.4 }); }, 4200);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    };
    const onLeave = () => { mouse.active = false; };
    const onClick = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      for (const p of particles) {
        const dx = p.x - x, dy = p.y - y;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / 700) * 60;
        p.vx += (dx / d) * f + (Math.random() - 0.5) * 6; p.vy += (dy / d) * f + (Math.random() - 0.5) * 6;
      }
      waves.push({ t: 0, strength: 1.4 });
    };
    const onScroll = () => {
      const r = canvas.getBoundingClientRect();
      scatter = Math.min(1, Math.max(0, -r.top / (r.height * 0.9)));
    };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    const onVis = () => { visible = document.visibilityState === 'visible'; };
    let resizeT = 0;
    const onResize = () => { window.clearTimeout(resizeT); resizeT = window.setTimeout(() => { build(); if (reduce) draw(); }, 150); };

    const host = canvas.parentElement!;
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('pointerdown', onClick);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener(THEME_EVENT, onResize);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearInterval(speak);
      io.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointerdown', onClick);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener(THEME_EVENT, onResize);
      window.removeEventListener(PRELOAD_EVENT, start);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
