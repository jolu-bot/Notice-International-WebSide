import type { Content } from '@/content/fr';
import type { Settings } from '@/content/settings';
import { href, type Locale } from '@/lib/i18n';
import { telLink, waLink } from '@/lib/utils';
import { Logo } from '../brand/Logo';
import { Btn, TLink } from '../fx/TLink';
import { Socials } from '../ui/Socials';
import { NewsletterForm } from '../forms/NewsletterForm';
import { ManageCookiesButton } from '../consent/Consent';
import { UserLock } from '../ui/Icons';

export function Footer({ locale, c, settings }: { locale: Locale; c: Content; settings: Settings }) {
  const f = c.footer;
  const year = new Date().getFullYear();
  const explore = (['agency', 'services', 'immo', 'work', 'news', 'appointment', 'quote', 'careers', 'contact'] as const).map((k) => ({ k, label: c.nav[k] }));
  return (
    <footer className="theme-dark relative overflow-hidden" role="contentinfo">
      {/* Appel final */}
      <section className="section relative">
        <div className="pointer-events-none absolute left-1/2 top-1/2 w-[120vw] max-w-[1600px] -translate-x-1/2 -translate-y-1/2 opacity-[.05]" data-parallax="0.3"><Logo /></div>
        <div className="wrap relative text-center">
          <p className="kicker justify-center" data-reveal>{settings.brand.slogan}</p>
          <h2 className="display mx-auto mt-8 max-w-[14ch]" data-split>{c.cta.title}</h2>
          <p className="lead mx-auto mt-8 text-center" data-reveal>{c.cta.text}</p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4" data-reveal>
            <Btn href={href(locale, 'appointment')}>{c.cta.primary}</Btn>
            <Btn href={href(locale, 'quote')} variant="ghost">{c.cta.secondary}</Btn>
          </div>
        </div>
      </section>

      <div className="mosaic-band animated" />

      <div className="wrap grid gap-14 py-20 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-4">
            <span className="w-16"><Logo /></span>
            <span className="text-xl font-extrabold tracking-tight">Notice International</span>
          </div>
          <p className="mt-6 max-w-sm text-[var(--muted)]">{f.tagline}</p>
          <p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-[var(--muted)]">{f.follow}</p>
          <Socials settings={settings} className="mt-4" />
        </div>

        <nav className="lg:col-span-2" aria-label={f.explore}>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--muted)]">{f.explore}</p>
          <ul className="mt-5 space-y-2.5">
            {explore.map(({ k, label }) => (
              <li key={k}><TLink href={href(locale, k)} className="link-underline">{label}</TLink></li>
            ))}
          </ul>
        </nav>

        <nav className="lg:col-span-3" aria-label={f.services}>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--muted)]">{f.services}</p>
          <ul className="mt-5 space-y-2.5">
            {c.services.items.map((s) => (
              <li key={s.slug}><TLink href={href(locale, 'services', s.slug)} className="link-underline">{s.title}</TLink></li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--muted)]">{f.contact}</p>
          <address className="mt-5 space-y-2.5 not-italic">
            <p>{settings.address.street}, {settings.address.district}<br />{settings.address.city}, {settings.address.country}</p>
            <p><a className="link-underline" href={telLink(settings.contact.phonePrimary)}>{settings.contact.phonePrimary}</a><br />
              <a className="link-underline" href={telLink(settings.contact.phoneSecondary)}>{settings.contact.phoneSecondary}</a></p>
            <p><a className="link-underline" href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a></p>
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              {settings.contact.whatsapp.map((w) => (
                <a key={w.number} className="link-underline text-[#25d366]" href={waLink(w.number)} target="_blank" rel="noopener noreferrer">WhatsApp · {w.label}</a>
              ))}
            </p>
          </address>
          <div className="mt-8">
            <p className="font-display text-xl">{c.newsletter.title}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{c.newsletter.text}</p>
            <NewsletterForm locale={locale} t={c.newsletter} />
          </div>
        </div>
      </div>

      <div className="wrap">
        <p aria-hidden className="select-none whitespace-nowrap text-center font-display text-[13.2vw] leading-[.8] tracking-[-.05em] text-transparent [-webkit-text-stroke:1px_color-mix(in_srgb,var(--fg)_14%,transparent)]">
          Notice International
        </p>
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="wrap flex flex-col gap-6 py-8 pb-28 text-sm text-[var(--muted)] lg:flex-row lg:items-center lg:justify-between lg:pb-8 lg:!pr-28">
          <div>
            <p>© {settings.brand.foundingYear}–{year} {settings.brand.legalName}. {f.rights}</p>
            <p className="mt-1 text-xs">RCCM {settings.legal.rccm} · NIU {settings.legal.niu}</p>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li><TLink className="link-underline" href={href(locale, 'legal')}>{f.legalNotice}</TLink></li>
            <li><TLink className="link-underline" href={href(locale, 'privacy')}>{f.privacy}</TLink></li>
            <li><TLink className="link-underline" href={href(locale, 'cookies')}>{f.cookies}</TLink></li>
            <li><TLink className="link-underline" href={href(locale, 'terms')}>{f.terms}</TLink></li>
            <li><ManageCookiesButton label={f.manageCookies} /></li>
            <li><a className="link-underline inline-flex items-center gap-1.5" href="/admin"><UserLock size={14} /> {c.nav.loginHint}</a></li>
          </ul>
          <a href={settings.credits.url} target="_blank" rel="noopener" className="group inline-flex items-center gap-2 font-semibold text-[#3b8bff] transition-colors hover:text-[#7db2ff]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3b8bff] transition-transform group-hover:scale-150" />
            {settings.credits.label}
          </a>
        </div>
      </div>
    </footer>
  );
}
