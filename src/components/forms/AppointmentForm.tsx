'use client';

import { useMemo, useState, type FormEvent } from 'react';
import type { Content } from '@/content/fr';
import type { Locale } from '@/lib/i18n';
import { cn, pad2, waLink } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Briefcase, Building, Calendar, Clock, Phone, Video } from '../ui/Icons';
import { Chips, ConsentBox, emailOk, ErrorNote, Field, Honeypot, phoneOk, SubmitButton, Success, TextArea, useSubmit } from './shared';
import { StepPanel, StepsBar } from './Stepper';

type Hours = { slots: string; saturdaySlots: string };
type Props = { locale: Locale; t: Content['forms']; p: Content['appointmentPage']; hours: Hours; whatsapp: string; address: string };

const MODE_ICONS = { office: Building, video: Video, phone: Phone, onsite: Briefcase } as const;
type Mode = keyof typeof MODE_ICONS;
const DOUALA_UTC_OFFSET = 1; // Afrique/Douala : UTC+1, sans heure d'été

const parseSlots = (s: string) => s.split(',').map((x) => x.trim()).filter((x) => /^\d{1,2}:\d{2}$/.test(x));
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** Créneaux d'un jour donné (dimanche fermé ; aujourd'hui, uniquement ceux à plus d'une heure). */
function slotsOn(d: Date, hours: Hours) {
  const day = d.getDay();
  if (day === 0) return [];
  const list = parseSlots(day === 6 ? hours.saturdaySlots : hours.slots);
  const now = new Date();
  if (ymd(d) !== ymd(now)) return list;
  return list.filter((s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m > now.getHours() * 60 + now.getMinutes() + 60; });
}

/** Le calendrier s'ouvre sur le mois du premier créneau disponible. */
function firstOpenMonth(hours: Hours) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 31 && !slotsOn(d, hours).length; i++) d.setDate(d.getDate() + 1);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function AppointmentForm({ locale, t, p, hours, whatsapp, address }: Props) {
  const { status, submit } = useSubmit('appointment', locale);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [subject, setSubject] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>('office');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState('');
  const [cursor, setCursor] = useState(() => firstOpenMonth(hours));
  const [v, setV] = useState({ name: '', email: '', phone: '', company: '', notes: '' });
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const maxDate = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 90); return d; }, [today]);
  const fmtLong = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtMonth = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { month: 'long', year: 'numeric' });
  const weekdays = locale === 'fr' ? ['L', 'M', 'M', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const slotsFor = (d: Date) => slotsOn(d, hours);

  const days = useMemo(() => {
    const first = new Date(cursor);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))] as Array<Date | null>;
  }, [cursor]);

  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); };
  const validate = (s: number) => {
    const err: Record<string, string> = {};
    if (s === 0 && !subject.length) err.subject = t.required;
    if (s === 1 && (!date || !time)) err.slot = t.required;
    if (s === 2) {
      if (!v.name.trim()) err.name = t.required;
      if (!emailOk(v.email)) err.email = t.invalidEmail;
      if (!v.phone.trim() || !phoneOk(v.phone)) err.phone = t.invalidPhone;
      if (!consent) err.consent = t.required;
    }
    setErrors(err);
    return !Object.keys(err).length;
  };

  const when = date ? `${fmtLong.format(date)} — ${time}` : '';
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 2) { if (validate(step)) go(step + 1); return; }
    if (!validate(2)) return;
    await submit({
      name: v.name, email: v.email, phone: v.phone, hp,
      data: { subject: subject[0], mode: p.modes[mode], date: date ? ymd(date) : '', time, when, company: v.company, notes: v.notes },
    });
  };

  // Liens d'agenda (créneau d'une heure, heure de Douala)
  const calendar = useMemo(() => {
    if (!date || !time) return null;
    const [h, m] = time.split(':').map(Number);
    const start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h - DOUALA_UTC_OFFSET, m));
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const title = `Notice International — ${subject[0] ?? ''}`;
    const details = `${p.modes[mode]} · ${subject[0] ?? ''}`;
    const location = mode === 'office' ? address : p.modes[mode];
    const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${stamp(start)}/${stamp(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Notice International//RDV//FR', 'BEGIN:VEVENT', `UID:${stamp(start)}-${Math.random().toString(36).slice(2)}@noticeinternational.com`,
      `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${title}`, `DESCRIPTION:${details}`, `LOCATION:${location}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return { google, ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}` };
  }, [date, time, subject, mode, p.modes, address]);

  if (status === 'success') {
    const waText = `${locale === 'fr' ? 'Bonjour, je confirme ma demande de rendez-vous' : 'Hello, I am confirming my appointment request'} : ${when} (${p.modes[mode]}) — ${v.name}`;
    return (
      <Success
        title={p.successTitle}
        text={`${p.successText} ${when}.`}
        action={calendar && (
          <>
            <a className="btn btn-ghost btn-sm !pr-5" href={calendar.google} target="_blank" rel="noopener noreferrer"><span>{p.googleCalendar}</span></a>
            <a className="btn btn-ghost btn-sm !pr-5" href={calendar.ics} download="rendez-vous-notice-international.ics"><span>{p.icsFile}</span></a>
            <a className="btn btn-primary btn-sm !pr-5" href={waLink(whatsapp, waText)} target="_blank" rel="noopener noreferrer"><span>{p.confirmWhatsapp}</span></a>
          </>
        )}
      />
    );
  }

  const canPrev = cursor > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <= maxDate;

  return (
    <form onSubmit={onSubmit} noValidate>
      <Honeypot value={hp} onChange={setHp} />
      <StepsBar steps={p.steps} current={step} />
      <StepPanel step={step} direction={dir}>
        {step === 0 && (
          <div className="grid gap-10">
            <div>
              <Chips label={p.subjectLabel} options={t.subjects} value={subject} onChange={setSubject} />
              {errors.subject && <span className="field-error">{errors.subject}</span>}
            </div>
            <fieldset>
              <legend className="field-label">{p.modeLabel}</legend>
              <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4" role="radiogroup">
                {(Object.keys(MODE_ICONS) as Mode[]).map((k) => {
                  const Icon = MODE_ICONS[k];
                  return (
                    <button type="button" key={k} role="radio" aria-checked={mode === k} onClick={() => setMode(k)}
                      className={cn('card flex flex-col items-start gap-6 p-5 text-left transition-all duration-500', mode === k ? '!border-[var(--c-orange)] !bg-[rgb(243_146_0/.12)]' : 'hover:!border-[var(--fg)]')}>
                      <Icon size={26} className={mode === k ? 'text-[var(--c-orange)]' : ''} />
                      <span className="font-bold">{p.modes[k]}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="field-label flex items-center gap-2"><Calendar size={14} /> {p.dateLabel}</p>
              <div className="card mt-3 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <button type="button" className="lb-btn !h-10 !w-10" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} disabled={!canPrev} aria-label="‹"><ArrowLeft size={16} /></button>
                  <p className="font-display text-xl first-letter:uppercase">{fmtMonth.format(cursor)}</p>
                  <button type="button" className="lb-btn !h-10 !w-10" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} disabled={!canNext} aria-label="›"><ArrowRight size={16} /></button>
                </div>
                <div className="cal-grid mb-2 text-center text-xs font-bold text-[var(--muted)]">{weekdays.map((w, i) => <span key={i}>{w}</span>)}</div>
                <div className="cal-grid">
                  {days.map((d, i) => {
                    if (!d) return <span key={i} />;
                    const disabled = d < today || d > maxDate || d.getDay() === 0 || slotsFor(d).length === 0;
                    const selected = date && ymd(d) === ymd(date);
                    return (
                      <button type="button" key={i} disabled={disabled} onClick={() => { setDate(d); setTime(''); }}
                        aria-pressed={!!selected} aria-label={fmtLong.format(d)}
                        className={cn('cal-day', selected && 'is-selected', ymd(d) === ymd(today) && 'is-today')}>
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div>
              <p className="field-label flex items-center gap-2"><Clock size={14} /> {p.timeLabel}</p>
              {date ? (
                <>
                  <p className="mt-3 font-display text-xl first-letter:uppercase">{fmtLong.format(date)}</p>
                  <div className="mt-5 grid grid-cols-3 gap-2" role="radiogroup">
                    {slotsFor(date).map((s) => (
                      <button type="button" key={s} role="radio" aria-checked={time === s} className="slot" onClick={() => setTime(s)}>{s}</button>
                    ))}
                  </div>
                  {!slotsFor(date).length && <p className="mt-4 text-[var(--muted)]">{p.noSlots}</p>}
                </>
              ) : (
                <p className="mt-3 text-[var(--muted)]">{p.sundayClosed}</p>
              )}
              {errors.slot && <span className="field-error">{errors.slot}</span>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="grid gap-8 md:grid-cols-2">
              <Field label={t.name} placeholder={t.namePlaceholder} value={v.name} onChange={set('name')} required autoComplete="name" error={errors.name} />
              <Field label={t.company} placeholder={t.companyPlaceholder} value={v.company} onChange={set('company')} autoComplete="organization" />
              <Field label={t.email} type="email" placeholder={t.emailPlaceholder} value={v.email} onChange={set('email')} required autoComplete="email" error={errors.email} />
              <Field label={t.phone} type="tel" placeholder={t.phonePlaceholder} value={v.phone} onChange={set('phone')} required autoComplete="tel" error={errors.phone} />
              <TextArea className="md:col-span-2" label={t.notes} placeholder={t.notesPlaceholder} value={v.notes} onChange={set('notes')} rows={3} />
              <div className="md:col-span-2"><ConsentBox t={t} locale={locale} checked={consent} onChange={setConsent} error={errors.consent} /></div>
            </div>
            <aside className="card h-fit p-6">
              <p className="field-label">{p.summary}</p>
              <dl className="mt-4 space-y-4">
                <div><dt className="text-xs text-[var(--muted)]">{p.subjectLabel}</dt><dd className="font-bold">{subject[0]}</dd></div>
                <div><dt className="text-xs text-[var(--muted)]">{p.modeLabel}</dt><dd className="font-bold">{p.modes[mode]}</dd></div>
                <div><dt className="text-xs text-[var(--muted)]">{p.dateLabel}</dt><dd className="font-display text-xl first-letter:uppercase">{when}</dd></div>
              </dl>
            </aside>
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
