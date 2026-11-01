'use client';

import { useState, type FormEvent } from 'react';
import type { Content } from '@/content/fr';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ArrowRight, Check } from '../ui/Icons';
import { emailOk, useSubmit } from './shared';

export function NewsletterForm({ locale, t }: { locale: Locale; t: Content['newsletter'] }) {
  const { status, submit } = useSubmit('newsletter', locale);
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [invalid, setInvalid] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailOk(email)) { setInvalid(true); return; }
    setInvalid(false);
    await submit({ email, hp, data: { source: 'footer' } });
  };

  if (status === 'success')
    return <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--c-orange)]"><Check size={16} /> {t.success}</p>;

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4">
      <div className="hp" aria-hidden><input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></div>
      <div className={cn('flex items-center rounded-full border p-1 pl-5 transition-colors focus-within:border-[var(--c-orange)]', invalid ? 'border-[#ff6b6b]' : 'border-[var(--line)]')}>
        <label className="sr-only" htmlFor="nl-email">{t.placeholder}</label>
        <input id="nl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.placeholder} autoComplete="email"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-[var(--muted)]" />
        <button type="submit" disabled={status === 'sending'} aria-label={t.button}
          className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[var(--btn-bg)] text-[var(--btn-fg)] transition-transform hover:scale-105 disabled:opacity-60">
          {status === 'sending' ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <ArrowRight size={16} />}
        </button>
      </div>
      {status === 'error' && <p className="mt-2 text-xs text-[#ff9b9b]">{locale === 'fr' ? 'Échec de l’inscription, réessayez.' : 'Subscription failed, please retry.'}</p>}
    </form>
  );
}
