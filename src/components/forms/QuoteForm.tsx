'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Content } from '@/content/fr';
import type { Locale } from '@/lib/i18n';
import { ArrowLeft } from '../ui/Icons';
import { Chips, ConsentBox, emailOk, ErrorNote, Field, Honeypot, phoneOk, SubmitButton, Success, TextArea, useSubmit } from './shared';
import { StepPanel, StepsBar } from './Stepper';

type Props = { locale: Locale; t: Content['forms']; p: Content['quotePage']; services: Array<{ slug: string; title: string }> };

export function QuoteForm({ locale, t, p, services }: Props) {
  const { status, submit } = useSubmit('quote', locale);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [goal, setGoal] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [budget, setBudget] = useState<string[]>([]);
  const [v, setV] = useState({ description: '', name: '', company: '', email: '', phone: '', city: '' });
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  // Pré-sélection depuis une page expertise : /devis?service=evenementiel
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('service');
    const found = services.find((s) => s.slug === slug);
    if (found) setPicked([found.title]);
  }, [services]);

  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); };
  const validate = (s: number) => {
    const err: Record<string, string> = {};
    if (s === 0 && !picked.length) err.services = t.required;
    if (s === 1 && v.description.trim().length < 10) err.description = t.required;
    if (s === 2) {
      if (!v.name.trim()) err.name = t.required;
      if (!emailOk(v.email)) err.email = t.invalidEmail;
      if (!v.phone.trim() || !phoneOk(v.phone)) err.phone = t.invalidPhone;
      if (!consent) err.consent = t.required;
    }
    setErrors(err);
    return !Object.keys(err).length;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 2) { if (validate(step)) go(step + 1); return; }
    if (!validate(2)) return;
    await submit({
      name: v.name, email: v.email, phone: v.phone, hp,
      data: { services: picked.join(', '), description: v.description, goal: goal[0] ?? '', timeline: timeline[0] ?? '', budget: budget[0] ?? '', company: v.company, city: v.city },
    });
  };

  if (status === 'success') return <Success title={p.successTitle} text={p.successText} />;

  return (
    <form onSubmit={onSubmit} noValidate>
      <Honeypot value={hp} onChange={setHp} />
      <StepsBar steps={p.steps} current={step} />
      <StepPanel step={step} direction={dir}>
        {step === 0 && (
          <div>
            <Chips label={p.servicesLabel} options={services.map((s) => s.title)} value={picked} onChange={setPicked} multiple />
            {errors.services && <span className="field-error">{errors.services}</span>}
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-10">
            <TextArea label={p.descriptionLabel} placeholder={p.descriptionPlaceholder} value={v.description} onChange={set('description')} rows={5} required error={errors.description} />
            <Chips label={p.goalsLabel} options={p.goals} value={goal} onChange={setGoal} />
            <div className="grid gap-10 lg:grid-cols-2">
              <Chips label={p.timelineLabel} options={p.timelines} value={timeline} onChange={setTimeline} />
              <Chips label={p.budgetLabel} options={p.budgets} value={budget} onChange={setBudget} />
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-8 md:grid-cols-2">
            <Field label={t.name} placeholder={t.namePlaceholder} value={v.name} onChange={set('name')} required autoComplete="name" error={errors.name} />
            <Field label={t.company} placeholder={t.companyPlaceholder} value={v.company} onChange={set('company')} autoComplete="organization" />
            <Field label={t.email} type="email" placeholder={t.emailPlaceholder} value={v.email} onChange={set('email')} required autoComplete="email" error={errors.email} />
            <Field label={t.phone} type="tel" placeholder={t.phonePlaceholder} value={v.phone} onChange={set('phone')} required autoComplete="tel" error={errors.phone} />
            <Field className="md:col-span-2" label={p.cityLabel} value={v.city} onChange={set('city')} autoComplete="address-level2" />
            <div className="md:col-span-2"><ConsentBox t={t} locale={locale} checked={consent} onChange={setConsent} error={errors.consent} /></div>
          </div>
        )}
      </StepPanel>
      {status === 'error' && <div className="mt-8"><ErrorNote text={t.error} /></div>}
      <div className="mt-12 flex flex-wrap items-center gap-4">
        {step > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)}>
            <span className="btn-arrow"><ArrowLeft size={15} /></span><span>{t.back}</span>
          </button>
        )}
        <SubmitButton status={status} t={t} label={step < 2 ? t.continue : t.send} />
      </div>
    </form>
  );
}
