import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent, getSettings } from '@/lib/content';
import { href, isLocale } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { telLink, waLink } from '@/lib/utils';
import { PageHero } from '@/components/sections/Sections';
import { AccessMap } from '@/components/sections/AccessMap';
import { ContactForm } from '@/components/forms/ContactForm';
import { Btn } from '@/components/fx/TLink';
import { Socials } from '@/components/ui/Socials';
import { Clock, Mail, Phone, WhatsApp } from '@/components/ui/Icons';
import { JsonLd } from '@/components/ui/JsonLd';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(await getContent(locale), locale, 'contact', 'contact');
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [c, s] = await Promise.all([getContent(locale), getSettings()]);
  const p = c.contactPage;

  return (
    <>
      <PageHero kicker={p.kicker} title={p.title} lead={p.lead} crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: c.nav.contact }]}>
        <div className="mt-10 flex flex-wrap gap-3" data-reveal data-delay="0.4">
          <Btn href={href(locale, 'appointment')}>{c.nav.cta}</Btn>
          <Btn href={waLink(s.contact.whatsapp[0]?.number ?? '', `${c.whatsapp.message}…`)} variant="ghost">{c.common.whatsappUs}</Btn>
        </div>
      </PageHero>

      <section className="section theme-light">
        <div className="wrap grid gap-16 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="h2" data-split>{p.formTitle}</h2>
            <div className="mt-12" data-reveal><ContactForm locale={locale} t={c.forms} /></div>
          </div>
          <aside className="space-y-6">
            <p className="kicker" data-reveal>{p.channelsTitle}</p>
            <ul className="space-y-3" data-stagger>
              <li><a href={telLink(s.contact.phonePrimary)} className="card card-hover flex items-center gap-4 p-5"><span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--c-ink)] text-[var(--c-cream)]"><Phone size={18} /></span><span><span className="block text-xs text-[var(--muted)]">{c.common.callUs}</span><span className="font-bold">{s.contact.phonePrimary}</span><span className="block text-sm text-[var(--muted)]">{s.contact.phoneSecondary}</span></span></a></li>
              {s.contact.whatsapp.map((w) => (
                <li key={w.number}><a href={waLink(w.number, `${c.whatsapp.message}…`)} target="_blank" rel="noopener noreferrer" className="card card-hover flex items-center gap-4 p-5"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#25d366] text-white"><WhatsApp size={20} /></span><span><span className="block text-xs text-[var(--muted)]">WhatsApp · {w.label}</span><span className="font-bold">{w.name}</span></span></a></li>
              ))}
              <li><a href={`mailto:${s.contact.email}`} className="card card-hover flex items-center gap-4 p-5"><span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--c-orange)] text-[var(--c-ink)]"><Mail size={18} /></span><span><span className="block text-xs text-[var(--muted)]">{c.common.writeUs}</span><span className="font-bold break-all">{s.contact.email}</span></span></a></li>
            </ul>
            <div className="card p-6" data-reveal>
              <p className="flex items-center gap-2 font-bold"><Clock size={18} className="text-[var(--c-orange)]" /> {p.hoursTitle}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">{p.weekdaysLabel}</dt><dd className="num">{s.hours.weekdays}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">{p.saturdayLabel}</dt><dd className="num">{s.hours.saturday}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">{p.sundayLabel}</dt><dd>{p.closed}</dd></div>
              </dl>
            </div>
            <div data-reveal><Socials settings={s} size="lg" /></div>
          </aside>
        </div>
      </section>

      <section className="section theme-dark" id="plan">
        <div className="wrap grid gap-14 lg:grid-cols-[1fr_1.6fr] lg:items-center">
          <div>
            <p className="kicker" data-reveal>{c.common.findUs}</p>
            <h2 className="h2 mt-6" data-split>{p.mapTitle}</h2>
            <p className="lead mt-6" data-reveal>{s.address.street}, {s.address.district} — {s.address.city}. {s.address.landmark}.</p>
            <ol className="mt-10 space-y-5" data-stagger>
              {p.directions.map((d, i) => (
                <li key={i} className="flex gap-5"><span className="num grid h-9 w-9 flex-none place-items-center rounded-full border border-[var(--line)] text-sm text-[var(--c-orange)]">{i + 1}</span><span className="text-[var(--muted)]">{d}</span></li>
              ))}
            </ol>
          </div>
          <div data-reveal="scale"><AccessMap t={p} mapQuery={s.address.mapQuery} openMapLabel={c.common.openMap} /></div>
        </div>
      </section>
      <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: c.nav.contact, path: href(locale, 'contact') }])} />
    </>
  );
}
