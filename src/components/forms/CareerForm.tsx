'use client';

import { useState, type FormEvent } from 'react';
import type { Content } from '@/content/fr';
import type { Locale } from '@/lib/i18n';
import { Chips, ConsentBox, emailOk, ErrorNote, Field, Honeypot, phoneOk, SubmitButton, Success, TextArea, useSubmit } from './shared';

export function CareerForm({ locale, t, p, cityLabel }: { locale: Locale; t: Content['forms']; p: Content['careersPage']; cityLabel: string }) {
  const { status, submit } = useSubmit('career', locale);
  const [v, setV] = useState({ name: '', email: '', phone: '', city: '', link: '', message: '' });
  const [profile, setProfile] = useState<string[]>([]);
  const [experience, setExperience] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!v.name.trim()) err.name = t.required;
    if (!emailOk(v.email)) err.email = t.invalidEmail;
    if (!v.phone.trim() || !phoneOk(v.phone)) err.phone = t.invalidPhone;
    if (!profile.length) err.profile = t.required;
    if (!consent) err.consent = t.required;
    setErrors(err);
    if (Object.keys(err).length) return;
    await submit({
      name: v.name, email: v.email, phone: v.phone, hp,
      data: { profile: profile.join(', '), experience: experience[0] ?? '', availability: availability[0] ?? '', city: v.city, link: v.link, message: v.message },
    });
  };

  if (status === 'success') return <Success title={p.successTitle} text={p.successText} />;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-9 md:grid-cols-2">
      <Honeypot value={hp} onChange={setHp} />
      <div className="md:col-span-2">
        <Chips label={p.profileLabel} options={p.profiles} value={profile} onChange={setProfile} multiple />
        {errors.profile && <span className="field-error">{errors.profile}</span>}
      </div>
      <Field label={t.name} placeholder={t.namePlaceholder} value={v.name} onChange={set('name')} required autoComplete="name" error={errors.name} />
      <Field label={t.email} type="email" placeholder={t.emailPlaceholder} value={v.email} onChange={set('email')} required autoComplete="email" error={errors.email} />
      <Field label={t.phone} type="tel" placeholder={t.phonePlaceholder} value={v.phone} onChange={set('phone')} required autoComplete="tel" error={errors.phone} />
      <Field label={cityLabel} value={v.city} onChange={set('city')} autoComplete="address-level2" />
      <div className="grid gap-8 md:col-span-2 md:grid-cols-2">
        <Chips label={p.experienceLabel} options={p.experiences} value={experience} onChange={setExperience} />
        <Chips label={p.availabilityLabel} options={p.availabilities} value={availability} onChange={setAvailability} />
      </div>
      <Field className="md:col-span-2" label={p.linkLabel} type="url" placeholder="https://" value={v.link} onChange={set('link')} hint={p.linkHint} />
      <TextArea className="md:col-span-2" label={t.message} placeholder={t.messagePlaceholder} value={v.message} onChange={set('message')} rows={4} />
      <div className="md:col-span-2"><ConsentBox t={t} locale={locale} checked={consent} onChange={setConsent} error={errors.consent} /></div>
      {status === 'error' && <div className="md:col-span-2"><ErrorNote text={t.error} /></div>}
      <div className="md:col-span-2"><SubmitButton status={status} t={t} /></div>
    </form>
  );
}
