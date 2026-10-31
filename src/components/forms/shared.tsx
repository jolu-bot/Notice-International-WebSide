'use client';

import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import gsap from 'gsap';
import type { Content } from '@/content/fr';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { TLink } from '../fx/TLink';
import { ArrowRight, Check } from '../ui/Icons';

export type FormKind = 'contact' | 'appointment' | 'quote' | 'career' | 'newsletter';
export type Status = 'idle' | 'sending' | 'success' | 'error';

export const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const phoneOk = (v: string) => !v.trim() || /^[+\d][\d\s().-]{6,}$/.test(v.trim());

/** Envoi vers /api/forms avec pot de miel et horodatage anti-robot. */
export function useSubmit(kind: FormKind, locale: Locale) {
  const [status, setStatus] = useState<Status>('idle');
  const started = useRef(Date.now());
  const submit = async (payload: { name?: string; email?: string; phone?: string; data: Record<string, unknown>; hp?: string }) => {
    setStatus('sending');
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, locale, ...payload, elapsed: Date.now() - started.current }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('success');
      return true;
    } catch {
      setStatus('error');
      return false;
    }
  };
  return { status, setStatus, submit };
}

type FieldBase = { label: string; error?: string; className?: string; hint?: ReactNode };

export function Field({ label, error, className, hint, ...input }: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn('field', error && 'has-error', className)}>
      <span className="field-label">{label}{input.required && <span className="dot-orange"> *</span>}</span>
      <input className="field-input" aria-invalid={!!error} {...input} />
      <span className="field-line" />
      {hint && <span className="mt-2 block text-xs text-[var(--muted)]">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

export function TextArea({ label, error, className, ...input }: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={cn('field', error && 'has-error', className)}>
      <span className="field-label">{label}{input.required && <span className="dot-orange"> *</span>}</span>
      <textarea className="field-input" aria-invalid={!!error} {...input} />
      <span className="field-line" />
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

export function Select({ label, error, className, options, placeholder, ...input }: FieldBase & SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; placeholder?: string }) {
  return (
    <label className={cn('field', error && 'has-error', className)}>
      <span className="field-label">{label}{input.required && <span className="dot-orange"> *</span>}</span>
      <select className="field-input" aria-invalid={!!error} {...input}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="field-line" />
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

export function Chips({ options, value, onChange, multiple, label }: { options: string[]; value: string[]; onChange: (v: string[]) => void; multiple?: boolean; label: string }) {
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2" role={multiple ? 'group' : 'radiogroup'}>
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button type="button" key={o} className="chip" role={multiple ? 'checkbox' : 'radio'} aria-checked={on}
              onClick={() => onChange(multiple ? (on ? value.filter((v) => v !== o) : [...value, o]) : [o])}>
              {multiple && <span className={cn('grid h-4 w-4 place-items-center rounded-full border', on ? 'border-transparent' : 'border-current opacity-50')}>{on && <Check size={12} />}</span>}
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ConsentBox({ t, locale, checked, onChange, error }: { t: Content['forms']; locale: Locale; checked: boolean; onChange: (v: boolean) => void; error?: string }) {
  const [before, after] = t.consent.split(t.privacyLink);
  return (
    <div>
      <label className="check">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required />
        <span>
          {after !== undefined ? (<>{before}<TLink href={`/${locale}/${locale === 'fr' ? 'confidentialite' : 'privacy'}`} className="underline underline-offset-4">{t.privacyLink}</TLink>{after}</>) : t.consent}
        </span>
      </label>
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}

export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="hp" aria-hidden>
      <label>Website<input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} name="website" /></label>
    </div>
  );
}

export function SubmitButton({ status, t, label }: { status: Status; t: Content['forms']; label?: string }) {
  return (
    <button type="submit" className="btn btn-primary" disabled={status === 'sending'} data-magnetic="0.2">
      <span>{status === 'sending' ? t.sending : label ?? t.send}</span>
      <span className="btn-arrow">
        {status === 'sending' ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : (<><ArrowRight size={15} /><ArrowRight size={15} /></>)}
      </span>
    </button>
  );
}

/** Écran de succès : une coche dessinée et une pluie de facettes aux couleurs de la marque. */
export function Success({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tl = gsap.timeline();
    tl.fromTo(el.querySelector('.ok-circle'), { scale: 0 }, { scale: 1, duration: 0.8, ease: 'back.out(2)' })
      .fromTo(el.querySelector('.ok-check'), { strokeDashoffset: 40 }, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.out' }, 0.3)
      .fromTo(el.querySelectorAll('.shard'), { x: 0, y: 0, scale: 0, rotate: 0 }, {
        x: () => gsap.utils.random(-220, 220), y: () => gsap.utils.random(-180, 120), rotate: () => gsap.utils.random(-360, 360), scale: 1,
        duration: 1.4, ease: 'expo.out', stagger: 0.01,
      }, 0.2)
      .to(el.querySelectorAll('.shard'), { autoAlpha: 0, duration: 0.8 }, 1.2)
      .fromTo(el.querySelectorAll('.ok-text > *'), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.9, ease: 'expo.out' }, 0.4);
    return () => { tl.kill(); };
  }, []);
  const colors = ['#f39200', '#e2001a', '#13286e', '#0068ae'];
  return (
    <div ref={ref} className="relative py-10 text-center" role="status" aria-live="polite">
      <div className="relative mx-auto h-24 w-24">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="shard absolute left-1/2 top-1/2 h-3 w-3" style={{ background: colors[i % 4], clipPath: 'polygon(50% 0, 100% 100%, 0 80%)' }} />
        ))}
        <span className="ok-circle absolute inset-0 grid place-items-center rounded-full" style={{ background: 'var(--mosaic)' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path className="ok-check" d="m5 12.5 4.5 4.5L19 7.5" strokeDasharray="40" />
          </svg>
        </span>
      </div>
      <div className="ok-text mt-8">
        <p className="h2">{title}</p>
        <p className="lead mx-auto mt-4 text-center">{text}</p>
        {action && <div className="mt-8 flex flex-wrap justify-center gap-3">{action}</div>}
      </div>
    </div>
  );
}

export function ErrorNote({ text }: { text: string }) {
  return <p className="rounded-2xl border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 p-4 text-sm text-[#ffb0b0]" role="alert">{text}</p>;
}
