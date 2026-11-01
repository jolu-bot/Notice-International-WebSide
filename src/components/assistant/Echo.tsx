'use client';

import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import gsap from 'gsap';
import type { Content } from '@/content/fr';
import type { Settings } from '@/content/settings';
import type { Locale } from '@/lib/i18n';
import { cn, telLink, waLink } from '@/lib/utils';
import { FACETS, MARK, MOUTH, LOGO_VIEWBOX } from '../brand/logo-data';
import { useExperience } from '../fx/Experience';
import { ArrowUpRight, Close, Mic, Phone, Refresh, Send, WhatsApp } from '../ui/Icons';

/* ═══════════════════════════════════════════════════════════════════
   ÉCHO — l'assistant de Notice International.
   Son visage : la bouche du logo, recomposée facette par facette,
   qui respire au repos, s'agite quand il réfléchit et « parle » quand il répond.
   ═══════════════════════════════════════════════════════════════════ */

type T = Content['assistant'];
type Handoff = 'none' | 'ceo' | 'assistant' | 'both';
type Action = { id: string; label: string; href: string };
type Msg = { id: string; role: 'user' | 'assistant'; text: string; actions?: Action[]; handoff?: Handoff; suggestions?: string[]; pending?: boolean; error?: boolean; instant?: boolean };
type Mood = 'idle' | 'thinking' | 'speaking' | 'listening';

const STORE = 'ni-echo';
const TEASED = 'ni-echo-teased';
const uid = () => Math.random().toString(36).slice(2, 10);
const COLORS = { orange: '#f39200', red: '#e2001a', navy: '#3557d6', blue: '#1a8fe0' } as const;

/* ─── Visage animé ─────────────────────────────────────────────────── */
export function EchoMark({ mood = 'idle', className }: { mood?: Mood; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const facets = svg.querySelectorAll<SVGPathElement>('[data-f]');
    const mouth = svg.querySelector<SVGPathElement>('[data-m]');
    const ctx = gsap.context(() => {
      gsap.set(facets, { transformBox: 'fill-box', transformOrigin: '50% 50%' });
      if (mood === 'idle') {
        gsap.to(facets, { scale: () => gsap.utils.random(0.9, 1.08), duration: () => gsap.utils.random(1.6, 2.6), ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.08, from: 'random' } });
        gsap.to(svg, { rotation: 4, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 50%' });
      } else if (mood === 'thinking') {
        gsap.to(facets, { rotation: () => gsap.utils.random(-40, 40), scale: () => gsap.utils.random(0.6, 1.2), duration: 0.45, ease: 'power2.inOut', yoyo: true, repeat: -1, stagger: { each: 0.04, from: 'center', repeat: -1, yoyo: true } });
      } else if (mood === 'speaking') {
        gsap.to(facets, { scale: () => gsap.utils.random(0.75, 1.3), y: () => gsap.utils.random(-14, 14), duration: () => gsap.utils.random(0.12, 0.24), ease: 'power1.inOut', yoyo: true, repeat: -1, repeatRefresh: true, stagger: { each: 0.02, from: 'random' } });
        if (mouth) gsap.to(mouth, { scaleY: 0.82, transformBox: 'fill-box', transformOrigin: '50% 50%', duration: 0.16, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      } else {
        gsap.to(facets, { scale: 1.18, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.05, from: 'edges' } });
      }
    }, svg);
    return () => ctx.revert();
  }, [mood]);
  const { w, h } = LOGO_VIEWBOX;
  return (
    <svg ref={ref} viewBox={`${-w * 0.14} ${-h * 0.2} ${w * 1.28} ${h * 1.4}`} className={className} aria-hidden>
      <path d={MOUTH} fill="#f5efe4" data-m />
      {FACETS.map((f, i) => <path key={i} d={f.d} fill={COLORS[f.color]} data-f />)}
      <path d={MARK} fill={COLORS.navy} />
    </svg>
  );
}

/* ─── Texte enrichi minimal (gras, listes, retours à la ligne) ─────── */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>);
}
function RichText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { blocks.push(<ul key={blocks.length} className="echo-list">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>); list = []; } };
  text.split('\n').forEach((raw) => {
    const line = raw.trim();
    if (/^[-•]\s+/.test(line)) { list.push(line.replace(/^[-•]\s+/, '')); return; }
    flush();
    if (line) blocks.push(<p key={blocks.length}>{inline(line)}</p>);
  });
  flush();
  return <>{blocks}</>;
}

/** Révèle progressivement le texte reçu, comme une voix qui s'élance. */
function useTypewriter(text: string, instant?: boolean) {
  const [n, setN] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (n > text.length) { setN(text.length); return; }
    if (n === text.length) return;
    const id = requestAnimationFrame(() => setN((v) => Math.min(text.length, v + Math.max(1, Math.ceil((text.length - v) / 18)))));
    return () => cancelAnimationFrame(id);
  }, [n, text]);
  return { shown: text.slice(0, n), done: n >= text.length };
}

function Bars() {
  return <span className="echo-bars" aria-hidden>{Array.from({ length: 7 }, (_, i) => <i key={i} />)}</span>;
}

/* ─── Relais vers un humain ────────────────────────────────────────── */
function HandoffCard({ who, t, settings, question }: { who: Handoff; t: T; settings: Settings; question: string }) {
  const [ceo, asst] = settings.contact.whatsapp;
  const people = [
    { key: 'ceo' as const, p: ceo, tel: settings.contact.phonePrimary },
    { key: 'assistant' as const, p: asst, tel: asst ? `+${asst.number}` : '' },
  ].filter((x) => x.p);
  const ordered = who === 'assistant' ? [...people].reverse() : people;
  const msg = `${t.handoffMessage}${question.slice(0, 400)}`;
  return (
    <div className="echo-handoff">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--muted)]">{t.handoffTitle}</p>
      <p className="mt-1 text-sm">{t.handoffText}</p>
      <ul className="mt-3 space-y-2">
        {ordered.map(({ key, p, tel }) => {
          const recommended = who === key;
          const initials = p!.name.split(' ').filter((x) => /^[A-ZÀ-Ý]/.test(x)).map((x) => x[0]).slice(0, 2).join('');
          return (
            <li key={key} className={cn('echo-person', recommended && 'is-recommended')}>
              <span className="echo-avatar" aria-hidden>{initials}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{p!.name}</span>
                <span className="block truncate text-xs text-[var(--muted)]">{p!.label}{recommended && <> · <span className="font-bold text-[var(--c-orange)]">{t.recommended}</span></>}</span>
              </span>
              <a href={waLink(p!.number, msg)} target="_blank" rel="noopener noreferrer" className="echo-round !bg-[#25d366] !text-white" aria-label={`${t.whatsapp} — ${p!.name}`}><WhatsApp size={18} /></a>
              <a href={telLink(tel)} className="echo-round" aria-label={`${t.call} — ${p!.name}`}><Phone size={16} /></a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─── Message ──────────────────────────────────────────────────────── */
function Bubble({ m, t, settings, question, onAction, onSuggest, last }: {
  m: Msg; t: T; settings: Settings; question: string; last: boolean;
  onAction: (a: Action) => void; onSuggest: (s: string) => void;
}) {
  const { shown, done } = useTypewriter(m.text, m.instant || m.role === 'user');
  if (m.role === 'user') return <div className="echo-row is-user"><div className="echo-bubble-user">{m.text}</div></div>;
  return (
    <div className="echo-row">
      <span className="echo-face" aria-hidden><EchoMark mood={m.pending && !m.text ? 'thinking' : !done ? 'speaking' : 'idle'} className="h-full w-full" /></span>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className={cn('echo-bubble-bot', m.error && 'is-error')}>
          {m.pending && !m.text ? <span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><Bars /> {t.thinking}</span> : <RichText text={shown} />}
        </div>
        {done && !m.pending && (
          <>
            {!!m.actions?.length && (
              <div className="flex flex-wrap gap-2">
                {m.actions.map((a) => (
                  <a key={a.id} href={a.href} onClick={(e) => { e.preventDefault(); onAction(a); }} className="echo-action">
                    {a.label} <ArrowUpRight size={14} />
                  </a>
                ))}
              </div>
            )}
            {m.handoff && m.handoff !== 'none' && <HandoffCard who={m.handoff} t={t} settings={settings} question={question} />}
            {last && !!m.suggestions?.length && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {m.suggestions.map((s) => <button key={s} type="button" className="echo-suggest" onClick={() => onSuggest(s)}>{s}</button>)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Reconnaissance vocale (si le navigateur la propose) ──────────── */
type Recognition = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
const getRecognition = (): (new () => Recognition) | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

/* ═══ Composant principal ═══════════════════════════════════════════ */
export function Echo({ locale, t, settings, privacyHref }: { locale: Locale; t: T; settings: Settings; privacyHref: string }) {
  const { navigate } = useExperience();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const recog = useRef<Recognition | null>(null);
  const abort = useRef<AbortController | null>(null);
  const closing = useRef(false);

  // Conversation conservée le temps de la visite (onglet), jamais envoyée ailleurs que vers l'assistant
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) || '[]') as Msg[];
      if (Array.isArray(saved) && saved.length) setMsgs(saved.filter((m) => !m.pending).map((m) => ({ ...m, instant: true })));
    } catch { /* stockage indisponible */ }
    setCanListen(!!getRecognition());
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify(msgs.filter((m) => !m.pending).slice(-30))); } catch { /* stockage indisponible */ }
  }, [msgs]);

  // Petite bulle d'accueil, une fois par visite
  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem(TEASED); } catch { /* */ }
    if (seen) return;
    const id = window.setTimeout(() => { setTeaser(true); try { sessionStorage.setItem(TEASED, '1'); } catch { /* */ } }, 9000);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    if (!teaser) return;
    const id = window.setTimeout(() => setTeaser(false), 12000);
    return () => window.clearTimeout(id);
  }, [teaser]);

  // Ouverture : le panneau se déploie en cercle depuis l'orbe
  useEffect(() => {
    if (!open || !panel.current) return;
    const el = panel.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      const tl = gsap.timeline();
      tl.fromTo(el, { clipPath: 'circle(0% at 92% 96%)' }, { clipPath: 'circle(150% at 92% 96%)', duration: 0.9, ease: 'expo.inOut', clearProps: 'clipPath' })
        .fromTo(el.querySelectorAll('[data-echo-in]'), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'expo.out', stagger: 0.06 }, 0.35);
    }
    if (window.matchMedia('(pointer: fine)').matches) window.setTimeout(() => field.current?.focus(), reduce ? 0 : 450);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = useCallback(() => {
    const el = panel.current;
    if (!el || closing.current) return;
    recog.current?.abort();
    const done = () => { closing.current = false; setOpen(false); launcher.current?.focus(); };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return done();
    closing.current = true;
    gsap.to(el, { clipPath: 'circle(0% at 92% 96%)', duration: 0.6, ease: 'expo.inOut', onComplete: done });
  }, []);

  // Défilement automatique vers le dernier message
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const id = requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
    return () => cancelAnimationFrame(id);
  }, [msgs, open]);

  const patch = (id: string, fn: (m: Msg) => Msg) => setMsgs((list) => list.map((m) => (m.id === id ? fn(m) : m)));

  const send = useCallback(async (raw: string) => {
    const text = raw.trim().slice(0, 1500);
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    const user: Msg = { id: uid(), role: 'user', text };
    const bot: Msg = { id: uid(), role: 'assistant', text: '', pending: true };
    const history = [...msgs.filter((m) => !m.error && m.text), user].map((m) => ({ role: m.role, content: m.text }));
    setMsgs((list) => [...list, user, bot]);
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const res = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale, messages: history }), signal: ctrl.signal });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line) as { type: string; value?: string; actions?: Action[]; handoff?: Handoff; suggestions?: string[] };
          if (ev.type === 'text') patch(bot.id, (m) => ({ ...m, text: m.text + (ev.value ?? '') }));
          else if (ev.type === 'reset') patch(bot.id, (m) => ({ ...m, text: '' }));
          else if (ev.type === 'meta') patch(bot.id, (m) => ({ ...m, actions: ev.actions, handoff: ev.handoff, suggestions: ev.suggestions }));
        }
      }
      patch(bot.id, (m) => ({ ...m, pending: false }));
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      patch(bot.id, (m) => ({ ...m, pending: false, error: true, text: t.error, handoff: 'both', actions: [] }));
    } finally {
      setBusy(false);
    }
  }, [busy, locale, msgs, t.error]);

  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(input); };

  const onAction = (a: Action) => {
    if (window.matchMedia('(max-width: 639px)').matches) close();
    navigate(a.href);
  };

  const reset = () => { abort.current?.abort(); setBusy(false); setMsgs([]); try { sessionStorage.removeItem(STORE); } catch { /* */ } field.current?.focus(); };

  const toggleListen = () => {
    if (listening) { recog.current?.stop(); return; }
    const R = getRecognition();
    if (!R) return;
    const r = new R();
    r.lang = locale === 'fr' ? 'fr-FR' : 'en-US';
    r.interimResults = true;
    r.continuous = false;
    let finalText = '';
    r.onresult = (e) => {
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript; else interim += res[0].transcript;
      }
      setInput((finalText + interim).trim());
    };
    r.onend = () => { setListening(false); recog.current = null; if (finalText.trim()) send(finalText); };
    r.onerror = () => { setListening(false); recog.current = null; };
    recog.current = r;
    setListening(true);
    try { r.start(); } catch { setListening(false); }
  };

  const lastUser = [...msgs].reverse().find((m) => m.role === 'user')?.text ?? '';
  const speaking = msgs.some((m) => m.pending);
  const mood: Mood = listening ? 'listening' : speaking ? 'thinking' : 'idle';

  return (
    <>
      {!open && (
        <div className="echo-launcher">
          <button ref={launcher} type="button" className="echo-orb" onClick={() => { setTeaser(false); setOpen(true); }} aria-label={t.open} aria-expanded={false} aria-controls="echo-panel" data-magnetic="0.35">
            <span className="echo-ring" aria-hidden /><span className="echo-ring" aria-hidden />
            <EchoMark className="relative h-9 w-9" />
            {teaser && <span className="echo-dot" aria-hidden />}
          </button>
          <span className="echo-label" aria-hidden>{t.launcher}</span>
          {teaser && (
            <div className="echo-teaser" role="status">
              <button type="button" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-[var(--muted)] hover:text-[var(--fg)]" onClick={() => setTeaser(false)} aria-label={t.close}><Close size={14} /></button>
              <p className="pr-6 text-sm leading-relaxed"><strong className="font-display text-base italic">{t.name}</strong> — {t.teaser}</p>
              <button type="button" className="mt-3 text-sm font-bold text-[var(--c-orange)]" onClick={() => { setTeaser(false); setOpen(true); }}>{t.chips[0]} →</button>
            </div>
          )}
        </div>
      )}

      {open && (
        <div ref={panel} id="echo-panel" className="echo-panel" role="dialog" aria-modal="false" aria-label={`${t.name} — ${t.role}`}>
          <header className="echo-head" data-echo-in>
            <span className={cn('echo-face is-lg', mood !== 'idle' && 'is-active')} aria-hidden><EchoMark mood={mood} className="h-full w-full" /></span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block font-display text-2xl italic">{t.name}</span>
              <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--muted)]"><span className="echo-online" aria-hidden />{t.status}</span>
            </span>
            {!!msgs.length && <button type="button" className="echo-round" onClick={reset} aria-label={t.reset} title={t.reset}><Refresh size={16} /></button>}
            <button type="button" className="echo-round" onClick={close} aria-label={t.close}><Close size={16} /></button>
          </header>

          <div ref={scroller} className="echo-scroll" data-lenis-prevent role="log" aria-live="polite" aria-relevant="additions text">
            {!msgs.length ? (
              <div className="flex min-h-full flex-col justify-end pb-2">
                <p className="kicker" data-echo-in>{t.introKicker}</p>
                <p className="mt-4 font-display text-[2.6rem] leading-[1] tracking-[-.03em]" data-echo-in><span className="italic-accent grad-text">{t.introTitle}</span></p>
                <p className="mt-4 text-[.95rem] text-[var(--muted)]" data-echo-in>{t.introText}</p>
                <div className="mt-7 grid grid-cols-2 gap-2" data-echo-in>
                  {t.chips.map((c) => <button key={c} type="button" className="echo-chip" onClick={() => send(c)}>{c}</button>)}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {msgs.map((m, i) => (
                  <Bubble key={m.id} m={m} t={t} settings={settings} question={lastUser} last={i === msgs.length - 1} onAction={onAction} onSuggest={send} />
                ))}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="echo-compose" data-echo-in>
            <div className={cn('echo-field', listening && 'is-listening')}>
              <textarea ref={field} value={input} rows={1} maxLength={1500} placeholder={listening ? t.listening : t.placeholder} aria-label={t.placeholder}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }}
                onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 140)}px`; }} />
              {canListen && (
                <button type="button" className={cn('echo-round', listening && 'is-on')} onClick={toggleListen} aria-pressed={listening} aria-label={t.listen} title={t.listen}><Mic size={17} /></button>
              )}
              <button type="submit" className="echo-send" disabled={busy || !input.trim()} aria-label={t.send}><Send size={17} /></button>
            </div>
            <p className="mt-2 text-center text-[.68rem] leading-snug text-[var(--muted)]">{t.disclaimer} <a href={privacyHref} onClick={(e) => { e.preventDefault(); onAction({ id: 'privacy', label: t.privacy, href: privacyHref }); }} className="underline underline-offset-2">{t.privacy}</a></p>
          </form>
        </div>
      )}
    </>
  );
}
