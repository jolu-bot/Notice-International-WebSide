'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from 'react';
import gsap from 'gsap';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { THEME_KEY } from '@/lib/theme';

/**
 * Thèmes : « Signature » (l'alternance clair/sombre voulue par l'agence, par défaut),
 * « Clair », « Sombre » et « Automatique » (suit le réglage de l'appareil).
 * Le choix est mémorisé sur l'appareil du visiteur ; il est appliqué avant le premier
 * rendu par le script d'initialisation de la mise en page (aucun flash).
 */
export type ThemePref = 'signature' | 'light' | 'dark' | 'auto';
export const THEME_EVENT = 'ni:theme';
const KEY = THEME_KEY;
const PREFS: ThemePref[] = ['signature', 'light', 'dark', 'auto'];

const LABELS: Record<Locale, Record<ThemePref, [string, string]> & { title: string; button: string }> = {
  fr: {
    title: 'Apparence',
    button: 'Changer l’apparence',
    signature: ['Signature', 'L’alternance clair-sombre de l’agence'],
    light: ['Clair', 'Tons papier, idéal en plein jour'],
    dark: ['Sombre', 'Tout en nuit, doux pour les yeux'],
    auto: ['Automatique', 'Suit le réglage de votre appareil'],
  },
  en: {
    title: 'Appearance',
    button: 'Change appearance',
    signature: ['Signature', 'The agency’s light-and-dark rhythm'],
    light: ['Light', 'Paper tones, perfect in daylight'],
    dark: ['Dark', 'All night, easy on the eyes'],
    auto: ['Automatic', 'Follows your device setting'],
  },
};

const listeners = new Set<() => void>();
const readPref = (): ThemePref => {
  if (typeof document === 'undefined') return 'signature';
  const p = document.documentElement.dataset.themePref as ThemePref | undefined;
  return p && PREFS.includes(p) ? p : 'signature';
};
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

function resolve(pref: ThemePref): 'light' | 'dark' | null {
  if (pref === 'auto') return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  return pref === 'signature' ? null : pref;
}

function commit(pref: ThemePref) {
  const html = document.documentElement;
  const next = resolve(pref);
  html.dataset.themePref = pref;
  if (next) html.dataset.theme = next; else delete html.dataset.theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', next === 'light' ? '#fbf8f2' : '#070a17'));
  window.dispatchEvent(new Event(THEME_EVENT));
  listeners.forEach((fn) => fn());
}

/** Applique un thème ; depuis un bouton, la nouvelle apparence se déploie en cercle à partir du clic. */
export function setTheme(pref: ThemePref, origin?: { x: number; y: number }) {
  try { localStorage.setItem(KEY, pref); } catch { /* navigation privée */ }
  const html = document.documentElement;
  const same = (html.dataset.theme ?? null) === resolve(pref);
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  if (same || !origin || !doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { commit(pref); return; }
  const r = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y));
  const vt = doc.startViewTransition(() => commit(pref));
  vt.ready.then(() => {
    html.animate(
      { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${r}px at ${origin.x}px ${origin.y}px)`] },
      { duration: 850, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', pseudoElement: '::view-transition-new(root)' },
    );
  }).catch(() => {});
}

export function useThemePref() {
  const pref = useSyncExternalStore(subscribe, readPref, () => 'signature' as ThemePref);
  // En mode automatique, on suit l'appareil en direct
  useEffect(() => {
    if (pref !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const on = () => commit('auto');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [pref]);
  return pref;
}

function ThemeIcon({ pref, size = 18 }: { pref: ThemePref; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (pref === 'light') return (
    <svg {...common}><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></svg>
  );
  if (pref === 'dark') return <svg {...common}><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" /></svg>;
  if (pref === 'auto') return (
    <svg {...common}><rect x="3" y="4.5" width="18" height="12.5" rx="2" /><path d="M8.5 20.5h7M12 17v3.5" /><path d="M12 7.5a3.2 3.2 0 0 0 0 6.4Z" fill="currentColor" stroke="none" /><circle cx="12" cy="10.7" r="3.2" /></svg>
  );
  // Signature : un disque mi-clair mi-sombre, en mosaïque
  return (
    <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none" /><path d="M7.4 8.6l2.4 2.1M6.8 13.6l3-1" /></svg>
  );
}

/** Bouton d'apparence de l'en-tête : ouvre un petit menu de quatre choix. */
export function ThemeMenu({ locale, className }: { locale: Locale; className?: string }) {
  const pref = useThemePref();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const t = LABELS[locale];

  useEffect(() => {
    if (!open) return;
    if (panel.current) {
      gsap.fromTo(panel.current, { autoAlpha: 0, y: -10, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'expo.out' });
      gsap.fromTo(panel.current.querySelectorAll('li'), { autoAlpha: 0, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.05, ease: 'expo.out', delay: 0.05 });
      panel.current.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    }
    const onDoc = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const choose = (p: ThemePref, e: MouseEvent) => {
    setTheme(p, { x: e.clientX || window.innerWidth - 80, y: e.clientY || 40 });
    setOpen(false);
  };

  return (
    <div ref={wrap} className={cn('relative', className)}>
      <button type="button" className="burger !text-[var(--fg)]" aria-haspopup="true" aria-expanded={open} aria-label={`${t.button} — ${t[pref][0]}`} title={t.title} onClick={() => setOpen((o) => !o)}>
        <ThemeIcon pref={pref} />
      </button>
      {open && (
        <div ref={panel} role="menu" aria-label={t.title} className="theme-menu absolute right-0 top-[calc(100%+.6rem)] w-72 p-2">
          <p className="px-3 pb-2 pt-2 text-[.68rem] font-bold uppercase tracking-[.2em] text-[var(--muted)]">{t.title}</p>
          <ul>
            {PREFS.map((p) => (
              <li key={p}>
                <button type="button" role="menuitemradio" aria-checked={pref === p} onClick={(e) => choose(p, e)}
                  className={cn('flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors', pref === p ? 'bg-[var(--fg)] text-[var(--bg)]' : 'hover:bg-[var(--card)]')}>
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-full border border-current/20"><ThemeIcon pref={p} size={17} /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{t[p][0]}</span>
                    <span className={cn('block text-xs', pref === p ? 'opacity-70' : 'text-[var(--muted)]')}>{t[p][1]}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Variante en ligne (menu plein écran, pied de page) : quatre pastilles. */
export function ThemeSwitch({ locale, tabIndex }: { locale: Locale; tabIndex?: number }) {
  const pref = useThemePref();
  const t = LABELS[locale];
  return (
    <div role="radiogroup" aria-label={t.title} className="flex flex-wrap gap-2">
      {PREFS.map((p) => (
        <button key={p} type="button" role="radio" aria-checked={pref === p} tabIndex={tabIndex} className="chip !py-2" onClick={(e) => setTheme(p, { x: e.clientX, y: e.clientY })}>
          <ThemeIcon pref={p} size={15} /> {t[p][0]}
        </button>
      ))}
    </div>
  );
}
