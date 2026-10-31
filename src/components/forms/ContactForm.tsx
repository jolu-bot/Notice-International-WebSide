'use client';

import { useState, type FormEvent } from 'react';
import type { Content } from '@/content/fr';
import type { Locale } from '@/lib/i18n';
import { ConsentBox, emailOk, ErrorNote, Field, Honeypot, phoneOk, Select, SubmitButton, Success, TextArea, useSubmit } from './shared';

const EMPTY = { name: '', email: '', phone: '', company: '', subject: '', message: '' };

export function ContactForm({ locale, t, defaultSubject }: { locale: Locale; t: Content['forms']; defaultSubject?: string }) {
  const { status, setStatus, submit } = useSubmit('contact', locale);
  const [v, setV] = useState({ ...EMPTY, subject: defaultSubject ?? '' });
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!v.name.trim()) err.name = t.required;
    if (!emailOk(v.email)) err.email = t.invalidEmail;
    if (!phoneOk(v.phone)) err.phone = t.invalidPhone;
    if (!v.message.trim()) err.message = t.required;
    if (!consent) err.consent = t.required;
    setErrors(err);
    if (Object.keys(err).length) return;
    await submit({ name: v.name, email: v.email, phone: v.phone, hp, data: { company: v.company, subject: v.subject, message: v.message } });
  };

  if (status === 'success')
    return (
      <Success
        title={t.successTitle}
        text={t.successText}
        action={<button className="btn btn-ghost btn-sm !pr-5" onClick={() => { setV(EMPTY); setConsent(false); setStatus('idle'); }}><span>{t.again}</span></button>}
      />
    );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 md:grid-cols-2">
      <Honeypot value={hp} onChange={setHp} />
      <Field label={t.name} placeholder={t.namePlaceholder} value={v.name} onChange={set('name')} required autoComplete="name" error={errors.name} />
      <Field label={t.email} type="email" placeholder={t.emailPlaceholder} value={v.email} onChange={set('email')} required autoComplete="email" error={errors.email} />
      <Field label={t.phone} type="tel" placeholder={t.phonePlaceholder} value={v.phone} onChange={set('phone')} autoComplete="tel" error={errors.phone} />
      <Field label={t.company} placeholder={t.companyPlaceholder} value={v.company} onChange={set('company')} autoComplete="organization" />
      <Select className="md:col-span-2" label={t.subject} options={t.subjects} value={v.subject} onChange={set('subject')} placeholder="—" />
      <TextArea className="md:col-span-2" label={t.message} placeholder={t.messagePlaceholder} value={v.message} onChange={set('message')} required rows={5} error={errors.message} />
      <div className="md:col-span-2"><ConsentBox t={t} locale={locale} checked={consent} onChange={setConsent} error={errors.consent} /></div>
      {status === 'error' && <div className="md:col-span-2"><ErrorNote text={t.error} /></div>}
      <div className="md:col-span-2"><SubmitButton status={status} t={t} /></div>
    </form>
  );
}
