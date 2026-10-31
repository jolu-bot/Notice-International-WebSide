'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Content } from '@/content/fr';
import { TLink } from '../fx/TLink';

type Choices = { analytics: boolean; media: boolean };
type State = Choices & { decided: boolean };
const KEY = 'ni-consent';
const MAX_AGE = 1000 * 60 * 60 * 24 * 182;
const OPEN_EVENT = 'ni:cookies';

const ConsentContext = createContext<{ consent: State; save: (c: Choices) => void; open: () => void }>({
  consent: { analytics: false, media: false, decided: false }, save: () => {}, open: () => {},
});
export const useConsent = () => useContext(ConsentContext);

export function ConsentProvider({ children, t, policyHref }: { children: ReactNode; t: Content['cookies']; policyHref: string }) {
  const [consent, setConsent] = useState<State>({ analytics: false, media: false, decided: true });
  const [panel, setPanel] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as Choices & { ts: number }) : null;
      if (parsed && Date.now() - parsed.ts < MAX_AGE) setConsent({ analytics: !!parsed.analytics, media: !!parsed.media, decided: true });
      else { setConsent({ analytics: false, media: false, decided: false }); setPanel(true); }
    } catch { setConsent({ analytics: false, media: false, decided: false }); setPanel(true); }
    const onOpen = () => setPanel(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  const save = useCallback((c: Choices) => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...c, ts: Date.now() })); } catch {}
    setConsent({ ...c, decided: true });
    setPanel(false);
  }, []);
  const open = useCallback(() => setPanel(true), []);

  return (
    <ConsentContext.Provider value={{ consent, save, open }}>
      {children}
      {consent.analytics && (<><Analytics /><SpeedInsights /></>)}
      {panel && <CookiePanel t={t} initial={consent} onSave={save} policyHref={policyHref} />}
    </ConsentContext.Provider>
  );
}

function CookiePanel({ t, initial, onSave, policyHref }: { t: Content['cookies']; initial: Choices; onSave: (c: Choices) => void; policyHref: string }) {
  const [custom, setCustom] = useState(false);
  const [choices, setChoices] = useState<Choices>({ analytics: initial.analytics, media: initial.media });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', delay: 1.2 });
  }, []);
  const toggle = (k: keyof Choices) => setChoices((c) => ({ ...c, [k]: !c[k] }));
  return (
    <div ref={ref} className="cookie-panel theme-dark !bg-transparent p-6" role="dialog" aria-modal="false" aria-labelledby="cookie-title" style={{ background: 'rgb(14 19 40 / .96)' }}>
      <div className="mosaic-band -mx-6 -mt-6 mb-5 rounded-t-[1.4rem]" />
      <p id="cookie-title" className="font-display text-xl">{t.title}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{t.text} <TLink href={policyHref} className="underline underline-offset-4">{t.learnMore}</TLink></p>
      {custom && (
        <ul className="mt-5 space-y-4">
          {(['necessary', 'analytics', 'media'] as const).map((k) => (
            <li key={k} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold">{t.categories[k].title}</p>
                <p className="text-xs text-[var(--muted)]">{t.categories[k].text}</p>
              </div>
              {k === 'necessary' ? (
                <button className="switch" role="switch" aria-checked="true" disabled aria-label={t.alwaysOn} />
              ) : (
                <button className="switch" role="switch" aria-checked={choices[k]} aria-label={t.categories[k].title} onClick={() => toggle(k)} />
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <button className="btn btn-primary btn-sm !pr-5" onClick={() => onSave({ analytics: true, media: true })}><span>{t.acceptAll}</span></button>
        <button className="btn btn-ghost btn-sm !pr-5" onClick={() => onSave({ analytics: false, media: false })}><span>{t.rejectAll}</span></button>
        {custom ? (
          <button className="btn btn-ghost btn-sm !pr-5" onClick={() => onSave(choices)}><span>{t.save}</span></button>
        ) : (
          <button className="px-3 text-sm font-semibold underline underline-offset-4" onClick={() => setCustom(true)}>{t.customize}</button>
        )}
      </div>
    </div>
  );
}

export function ManageCookiesButton({ label }: { label: string }) {
  return <button className="link-underline" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>{label}</button>;
}
