import type { ReactNode } from 'react';
import type { Content } from '@/content/fr';
import { href, type Locale } from '@/lib/i18n';
import { cn, fillTokens, telLink } from '@/lib/utils';
import { Logo } from '../brand/Logo';
import { FACETS } from '../brand/logo-data';
import { Btn, TLink } from '../fx/TLink';
import { Picture } from '../ui/Picture';
import { ArrowUpRight, Mail, Phone, Plus } from '../ui/Icons';

/* ─── En-tête de section ─────────────────────────────────────────── */
export function SectionHead({ label, title, intro, className, align = 'left', children }: { label: string; title: string; intro?: string; className?: string; align?: 'left' | 'center'; children?: ReactNode }) {
  return (
    <div className={cn('grid gap-8', align === 'center' ? 'justify-items-center text-center' : 'lg:grid-cols-[1.5fr_1fr] lg:items-end', className)}>
      <div>
        <p className="kicker" data-reveal>{label}</p>
        <h2 className={cn('h2 mt-6', align === 'center' ? 'mx-auto max-w-[18ch]' : 'max-w-[16ch]')} data-split>{title}</h2>
      </div>
      {(intro || children) && (
        <div data-reveal data-delay="0.15">
          {intro && <p className={cn('lead', align === 'center' && 'mx-auto')}>{intro}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Bandeau des verbes stratégiques ────────────────────────────── */
export function VerbsMarquee({ verbs }: { verbs: string[] }) {
  const list = [...verbs, ...verbs];
  return (
    <section className="theme-dark overflow-hidden border-y border-[var(--line)] py-8" aria-label={verbs.join(', ')}>
      <div className="marquee" style={{ ['--marquee-duration' as string]: '55s' }} data-skew>
        {[0, 1].map((k) => (
          <div key={k} className="marquee-track" aria-hidden={k === 1}>
            {list.map((v, i) => (
              <span key={`${k}-${i}`} className="flex items-center gap-[clamp(2rem,5vw,5rem)] whitespace-nowrap font-display text-[clamp(2.2rem,1.4rem+3vw,4.6rem)] leading-none">
                <span className={i % 2 ? 'italic-accent text-[var(--muted)]' : ''}>{v}</span>
                <span className="inline-block h-4 w-4 flex-none" style={{ background: ['var(--c-orange)', 'var(--c-red)', 'var(--c-blue)', 'var(--c-navy)'][i % 4], clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Manifeste ──────────────────────────────────────────────────── */
export function Manifesto({ t }: { t: Content['manifesto'] }) {
  return (
    <section className="section theme-dark relative overflow-hidden">
      <div className="pointer-events-none absolute -left-[10vw] top-10 w-[40vw] max-w-[520px] opacity-[.06]" data-parallax="0.4" aria-hidden><Logo /></div>
      <div className="wrap relative grid gap-10 lg:grid-cols-[14rem_1fr]">
        <p className="kicker h-fit" data-reveal>{t.label}</p>
        <div>
          <p className="font-display text-[clamp(1.8rem,1.1rem+2.6vw,3.6rem)] font-[350] leading-[1.18] tracking-[-.02em]" data-scrub-words>{t.text}</p>
          <p className="mt-10 flex items-center gap-4 text-sm font-semibold text-[var(--muted)]" data-reveal>
            <span className="h-px w-12 bg-[var(--c-orange)]" />{t.signature}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Chiffres clés ──────────────────────────────────────────────── */
export function Stats({ t, tokens }: { t: Content['stats']; tokens: Record<string, number> }) {
  return (
    <section className="section-tight theme-light">
      <div className="wrap">
        <p className="kicker" data-reveal>{t.label}</p>
        <dl className="mt-12 grid gap-px overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4" data-stagger>
          {t.items.map((it, i) => {
            const raw = fillTokens(it.value, tokens);
            const n = parseInt(raw, 10);
            return (
              <div key={i} className="group relative bg-[var(--bg)] p-8 transition-colors duration-700 hover:bg-[var(--c-ink)] hover:text-[var(--c-cream)]">
                <dt className="sr-only">{it.label}</dt>
                <dd>
                  <span className="stat-num block">
                    <span data-counter={Number.isFinite(n) ? n : undefined}>{Number.isFinite(n) ? n : raw}</span>
                    <span className="text-[.42em] italic-accent text-[var(--c-orange)]">{it.suffix}</span>
                  </span>
                  <span className="mt-5 block max-w-[24ch] text-[var(--muted)] group-hover:text-[rgb(245_239_228/.7)]">{it.label}</span>
                </dd>
                <span className="absolute right-6 top-6 h-3 w-3 transition-transform duration-700 group-hover:rotate-180" style={{ background: ['var(--c-orange)', 'var(--c-red)', 'var(--c-blue)', 'var(--c-navy)'][i % 4], clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

/* ─── Deux univers ───────────────────────────────────────────────── */
export function Universes({ t, locale }: { t: Content['universes']; locale: Locale }) {
  const panels = [
    { key: 'com', data: t.com, img: '/images/work/coca-4', href: href(locale, 'services') },
    { key: 'immo', data: t.immo, img: '/images/brand/solar', href: href(locale, 'immo') },
  ] as const;
  return (
    <section className="section theme-dark">
      <div className="wrap">
        <SectionHead label={t.label} title={t.title} />
        <div className="universes mt-16 grid gap-5">
          {panels.map((p, i) => (
            <TLink key={p.key} href={p.href} className="universe group p-8 md:p-12" data-reveal data-delay={String(i * 0.15)} data-cursor={p.data.cta.split(' ')[0]}>
              <Picture src={p.img} alt={p.data.name} className="universe-img" sizes="(min-width:1024px) 60vw, 100vw" />
              <span className="tag w-fit !border-white/30 !text-white/80">{p.data.tag}</span>
              <h3 className="h2 mt-5 max-w-[12ch] text-white">{p.data.name}</h3>
              <p className="mt-4 max-w-[46ch] text-white/75">{p.data.text}</p>
              <span className="mt-8 inline-flex items-center gap-3 font-bold text-white">
                {p.data.cta}
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[var(--c-ink)] transition-transform duration-700 group-hover:rotate-45"><ArrowUpRight size={18} /></span>
              </span>
            </TLink>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Démarche en quatre temps ───────────────────────────────────── */
export function Method({ t }: { t: Content['method'] }) {
  return (
    <section className="section theme-light relative overflow-hidden" data-draw-root>
      <div className="wrap">
        <SectionHead label={t.label} title={t.title} intro={t.intro} />
        <div className="relative mt-20">
          <svg className="pointer-events-none absolute left-0 top-10 hidden h-[120px] w-full lg:block" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden>
            <path d="M0 60 C 150 0, 250 120, 400 60 S 650 0, 800 60 S 1050 120, 1200 60" fill="none" stroke="url(#mgrad)" strokeWidth="2.5" data-draw />
            <defs><linearGradient id="mgrad" x1="0" x2="1"><stop offset="0" stopColor="#0068ae" /><stop offset=".35" stopColor="#f39200" /><stop offset=".7" stopColor="#e2001a" /><stop offset="1" stopColor="#13286e" /></linearGradient></defs>
          </svg>
          <ol className="relative grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8" data-stagger="0.12">
            {t.steps.map((s, i) => (
              <li key={i} className="group">
                <span className="relative grid h-[120px] place-items-start">
                  <span className="grid h-20 w-20 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg)] font-display text-3xl transition-all duration-700 group-hover:scale-110 group-hover:border-transparent group-hover:bg-[var(--c-ink)] group-hover:text-[var(--c-cream)]" style={{ marginTop: i % 2 ? 44 : 4 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </span>
                <h3 className="h3 mt-6">{s.title}</h3>
                <p className="mt-3 text-[var(--muted)]">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ─── Réalisations en défilement horizontal ──────────────────────── */
export function WorkRail({ t, locale, common, limit = 7 }: { t: Content['work']; locale: Locale; common: Content['common']; limit?: number }) {
  const items = t.items.slice(0, limit);
  return (
    <section className="theme-dark relative overflow-hidden">
      <div className="flex items-center py-24 lg:h-screen lg:py-0" data-hscroll>
        <div className="flex w-full snap-x snap-mandatory gap-6 overflow-x-auto px-[var(--gutter)] pb-6 lg:w-max lg:overflow-visible lg:pb-0" data-hscroll-track>
          <div className="flex w-[82vw] flex-none snap-start flex-col justify-center pr-6 sm:w-[60vw] lg:w-[34vw]">
            <p className="kicker">{t.label}</p>
            <h2 className="h2 mt-6 max-w-[13ch]">{t.title}</h2>
            <p className="lead mt-6">{t.intro}</p>
            <div className="mt-10"><Btn href={href(locale, 'work')} variant="ghost">{common.seeAll}</Btn></div>
          </div>
          {items.map((p, i) => (
            <TLink key={p.slug} href={href(locale, 'work', p.slug)} className="group relative flex w-[82vw] flex-none snap-start flex-col sm:w-[56vw] lg:w-[min(38vw,620px)]" data-hscroll-item data-cursor={common.seeProject.split(' ')[0]}>
              <div className={cn('img-zoom relative overflow-hidden rounded-[1.6rem]', i % 2 ? 'aspect-[4/5]' : 'aspect-[4/3.4]')}>
                <Picture src={p.cover} alt={p.title} className="absolute inset-0" sizes="(min-width:1024px) 40vw, 82vw" />
                <span className="absolute left-5 top-5 rounded-full bg-[rgb(7_10_23/.7)] px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{t.filters[p.category as keyof typeof t.filters] ?? p.category}</span>
                <span className="absolute bottom-5 right-5 grid h-14 w-14 scale-0 place-items-center rounded-full bg-[var(--c-orange)] text-[var(--c-ink)] transition-transform duration-700 group-hover:scale-100"><ArrowUpRight size={22} /></span>
              </div>
              <div className="mt-5 flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[.16em] text-[var(--c-orange)]">{p.client}</p>
                  <h3 className="h3 mt-2 max-w-[22ch]">{p.title}</h3>
                </div>
                <span className="num text-sm text-[var(--muted)]">{String(i + 1).padStart(2, '0')}</span>
              </div>
            </TLink>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Mur des clients ────────────────────────────────────────────── */
export function ClientsWall({ t }: { t: Content['clients'] }) {
  const half = Math.ceil(t.items.length / 2);
  const rows = [t.items.slice(0, half), t.items.slice(half)];
  return (
    <section className="section theme-light overflow-hidden">
      <div className="wrap"><SectionHead label={t.label} title={t.title} align="center" /></div>
      <div className="mt-16 space-y-6">
        {rows.map((row, r) => (
          <div key={r} className={cn('marquee', r % 2 === 1 && 'reverse')} style={{ ['--marquee-duration' as string]: `${32 + r * 8}s` }}>
            {[0, 1].map((k) => (
              <ul key={k} className="marquee-track" aria-hidden={k === 1}>
                {[...row, ...row].map((name, i) => (
                  <li key={`${k}-${i}`} className="group flex items-center gap-6 whitespace-nowrap">
                    <span className={cn('font-display text-[clamp(1.8rem,1.2rem+2.4vw,3.6rem)] leading-none tracking-[-.02em] transition-colors duration-500 group-hover:text-[var(--c-red)]', i % 3 === 1 && 'italic-accent')}>{name}</span>
                    <span className="h-2 w-2 rounded-full bg-[var(--c-orange)]" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Pourquoi nous faire confiance ──────────────────────────────── */
export function Why({ t }: { t: Content['why'] }) {
  return (
    <section className="section theme-dark">
      <div className="wrap grid gap-16 lg:grid-cols-[1fr_1.3fr]">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <p className="kicker" data-reveal>{t.label}</p>
          <h2 className="h2 mt-6 max-w-[14ch]" data-split>{t.title}</h2>
          <div className="mt-12 hidden w-56 lg:block" data-reveal><Logo /></div>
        </div>
        <ol className="space-y-px" data-stagger="0.1">
          {t.items.map((it, i) => (
            <li key={i} className="group grid grid-cols-[4rem_1fr] gap-6 border-t border-[var(--line)] py-9 last:border-b">
              <span className="num text-4xl text-[var(--muted)] transition-colors duration-500 group-hover:text-[var(--c-orange)]">{i + 1}</span>
              <div>
                <h3 className="h3 transition-transform duration-700 group-hover:translate-x-2">{it.title}</h3>
                <p className="mt-3 max-w-[52ch] text-[var(--muted)]">{it.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─── Monogramme mosaïque (en l'absence de photo) ────────────────── */
function MosaicPortrait({ name, seed }: { name: string; seed: number }) {
  const caps = name.split(/\s+/).filter((w) => /^[A-ZÉÈ]/.test(w));
  const initials = caps.length > 1 ? `${caps[0][0]}${caps[caps.length - 1][0]}` : (caps[0]?.[0] ?? '');
  const colors = ['var(--c-orange)', 'var(--c-red)', 'var(--c-blue)', 'var(--c-navy)'];
  return (
    <svg viewBox="0 0 615 548" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="615" height="548" fill="#0e1328" />
      {FACETS.map((f, i) => (
        <path key={i} d={f.d} fill={colors[(i + seed) % 4]} opacity={0.9} className="origin-center transition-transform duration-1000 group-hover:scale-[1.04]" style={{ transformOrigin: `${f.cx}px ${f.cy}px` }} />
      ))}
      <text x="307" y="330" textAnchor="middle" fill="#f5efe4" style={{ fontFamily: 'var(--font-display)', fontSize: 170, fontStyle: 'italic' }}>{initials}</text>
    </svg>
  );
}

/* ─── Équipe ─────────────────────────────────────────────────────── */
export function Team({ t }: { t: Content['team'] }) {
  return (
    <section className="section theme-light">
      <div className="wrap">
        <SectionHead label={t.label} title={t.title} intro={t.intro} />
        <ul className="mt-16 grid gap-8 md:grid-cols-3" data-stagger="0.12">
          {t.members.map((m, i) => (
            <li key={m.name} className="group">
              <div className="team-avatar">
                {m.photo ? <Picture src={m.photo} alt={m.name} className="absolute inset-0" sizes="(min-width:768px) 33vw, 100vw" /> : <MosaicPortrait name={m.name} seed={i} />}
              </div>
              <h3 className="h3 mt-6">{m.name}</h3>
              <p className="mt-1 text-sm font-bold uppercase tracking-[.14em] text-[var(--c-red)]">{m.role}</p>
              <p className="mt-4 text-[var(--muted)]">{m.bio}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {m.phone && <a href={telLink(m.phone)} className="chip"><Phone size={14} />{m.phone}</a>}
                {m.email && <a href={`mailto:${m.email}`} className="chip" aria-label={m.email}><Mail size={14} />E-mail</a>}
              </div>
            </li>
          ))}
        </ul>
        <a href={t.partner.url} target="_blank" rel="noopener" className="card card-hover mt-14 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between" data-reveal>
          <div className="flex items-center gap-5">
            <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-[#0b3d91] font-display text-xl italic text-white">LB</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--muted)]">{t.partner.label}</p>
              <p className="font-bold">{t.partner.name} <span className="font-normal text-[var(--muted)]">— {t.partner.role}</span></p>
            </div>
          </div>
          <p className="max-w-md text-sm text-[var(--muted)]">{t.partner.bio}</p>
        </a>
      </div>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────── */
export function Faq({ t }: { t: Content['faq'] }) {
  return (
    <section className="section theme-dark">
      <div className="wrap grid gap-14 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="kicker" data-reveal>{t.label}</p>
          <h2 className="h2 mt-6 max-w-[12ch]" data-split>{t.title}</h2>
        </div>
        <div data-reveal>
          {t.items.map((it, i) => (
            <details key={i} className="faq-item group" name="faq">
              <summary>
                <span className="h3 !text-[clamp(1.15rem,1rem+.6vw,1.5rem)]">{it.q}</span>
                <span className="faq-icon"><Plus size={18} /></span>
              </summary>
              <div className="faq-body pb-8 pr-14 text-[var(--muted)]">{it.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── En-tête de page intérieure ─────────────────────────────────── */
export function PageHero({ kicker, title, lead, image, children, crumbs }: { kicker: string; title: string; lead?: string; image?: string; children?: ReactNode; crumbs?: Array<{ label: string; href?: string }> }) {
  return (
    <section className="theme-dark relative overflow-hidden pt-[calc(var(--header-h)+clamp(3rem,10vw,8rem))] pb-[clamp(3rem,8vw,7rem)]">
      <div className="pointer-events-none absolute -right-[15vw] -top-[10vw] w-[60vw] max-w-[820px] opacity-[.06]" data-parallax="0.35" aria-hidden><Logo /></div>
      <div className="wrap relative">
        {crumbs && (
          <nav aria-label="Fil d’Ariane" className="mb-10 text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]" data-reveal>
            <ol className="flex flex-wrap items-center gap-2">
              {crumbs.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden>/</span>}
                  {c.href ? <TLink href={c.href} className="link-underline">{c.label}</TLink> : <span aria-current="page" className="text-[var(--fg)]">{c.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <p className="kicker" data-reveal>{kicker}</p>
        <h1 className="h1 mt-6 max-w-[16ch]" data-split="now">{title}</h1>
        {lead && <p className="lead mt-8" data-reveal data-delay="0.3">{lead}</p>}
        {children}
      </div>
      {image && (
        <div className="wrap relative mt-16">
          <div className="aspect-[16/8] overflow-hidden rounded-[2rem]" data-img-reveal>
            <Picture src={image} alt={title} className="h-full w-full" sizes="100vw" priority />
          </div>
        </div>
      )}
    </section>
  );
}
