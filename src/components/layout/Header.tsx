'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import type { Content } from '@/content/fr';
import type { Settings } from '@/content/settings';
import { href, switchLocalePath, type Locale, type RouteKey } from '@/lib/i18n';
import { cn, telLink, waLink } from '@/lib/utils';
import { Logo } from '../brand/Logo';
import { TLink, Btn } from '../fx/TLink';
import { useExperience } from '../fx/Experience';
import { Socials } from '../ui/Socials';
import { Close, UserLock } from '../ui/Icons';
import { ThemeMenu, ThemeSwitch } from '../fx/Theme';

type Props = { locale: Locale; nav: Content['nav']; easter: Content['easter']; settings: Settings };

const MAIN: RouteKey[] = ['agency', 'services', 'immo', 'work', 'contact'];
const MENU: RouteKey[] = ['home', 'agency', 'services', 'immo', 'work', 'appointment', 'quote', 'careers', 'contact'];

export function Header({ locale, nav, easter, settings }: Props) {
  const pathname = usePathname();
  const { navigate } = useExperience();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [egg, setEgg] = useState(false);
  const clicks = useRef<number[]>([]);
  const eggRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      if (y > 240 && y > last + 4) setHidden(true);
      else if (y < last - 4 || y < 240) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setEgg(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // « 7X faites-vous écouter » : 7 clics sur le logo révèlent un secret
  const onLogo = () => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 4000), now];
    if (clicks.current.length >= 7) { clicks.current = []; setEgg(true); }
  };
  useEffect(() => {
    if (!egg || !eggRef.current) return;
    const el = eggRef.current;
    const tl = gsap.timeline();
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 })
      .fromTo(el.querySelectorAll('[data-facet]'), { scale: 0, rotate: () => gsap.utils.random(-180, 180) }, { scale: 1, rotate: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)', stagger: 0.03 }, 0.1)
      .to(el.querySelectorAll('[data-facet]'), { x: () => gsap.utils.random(-25, 25), y: () => gsap.utils.random(-25, 25), repeat: 7, yoyo: true, duration: 0.12, ease: 'power1.inOut' }, 1.1)
      .fromTo(el.querySelectorAll('.egg-text > *'), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.12, duration: 0.9, ease: 'expo.out' }, 0.6);
    return () => { tl.kill(); };
  }, [egg]);

  const other: Locale = locale === 'fr' ? 'en' : 'fr';
  const setLocaleCookie = (l: Locale) => { document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000; samesite=lax`; };
  const isActive = (key: RouteKey) => {
    const target = href(locale, key);
    return key === 'home' ? pathname === target : pathname.startsWith(target);
  };

  return (
    <>
      <header className={cn('site-header', scrolled && 'is-scrolled', hidden && !open && 'is-hidden')}>
        <div className="wrap flex items-center justify-between gap-6">
          <TLink href={href(locale, 'home')} onClick={onLogo} className="group flex items-center gap-3" aria-label={`${settings.brand.name} — ${nav.home}`}>
            <span className="block w-12 transition-transform duration-700 group-hover:rotate-[-8deg] group-hover:scale-110"><Logo /></span>
            <span className="hidden leading-none sm:block">
              <span className="block text-[1.02rem] font-extrabold tracking-tight">Notice International</span>
              <span className="mt-1 block text-[.62rem] font-bold uppercase tracking-[.22em] text-[var(--muted)]">{settings.brand.slogan}</span>
            </span>
          </TLink>

          <nav aria-label="Navigation principale" className="hidden items-center gap-8 lg:flex">
            {MAIN.map((key) => (
              <TLink key={key} href={href(locale, key)} className="nav-link" aria-current={isActive(key) ? 'page' : undefined}>
                {nav[key as keyof typeof nav]}
              </TLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="lang-switch" role="group" aria-label="Langue / Language">
              {(['fr', 'en'] as Locale[]).map((l) => (
                <a key={l} href={l === locale ? undefined : switchLocalePath(pathname, l)} hrefLang={l} lang={l} aria-current={l === locale ? 'true' : undefined}
                  onClick={(e) => { if (l === locale) { e.preventDefault(); return; } e.preventDefault(); setLocaleCookie(l); navigate(switchLocalePath(pathname, l)); }}>
                  {l.toUpperCase()}
                </a>
              ))}
            </div>
            <ThemeMenu locale={locale} className="max-sm:hidden" />
            {/* Espace d'administration : page à part (pas de transition animée) */}
            <a href="/admin" className="login-link max-xl:!w-12 max-xl:justify-center max-xl:!px-0" aria-label={`${nav.login} — ${nav.loginHint}`} title={nav.loginHint}>
              <UserLock size={18} /><span className="hidden xl:inline">{nav.login}</span>
            </a>
            <span className="hidden 2xl:block"><Btn href={href(locale, 'appointment')} size="sm">{nav.cta}</Btn></span>
            <button className="burger" aria-expanded={open} aria-controls="menu-overlay" aria-label={open ? nav.close : nav.menu} onClick={() => setOpen((o) => !o)} data-magnetic="0.3">
              <span /><span />
            </button>
          </div>
        </div>
      </header>

      <div id="menu-overlay" className={cn('menu-overlay', open && 'is-open')} aria-hidden={!open}>
        <div className="menu-bg" />
        <div className="relative flex h-full flex-col overflow-y-auto pt-[calc(var(--header-h)+2rem)] pb-10">
          <div className="pointer-events-none absolute -right-[12vw] top-1/2 w-[70vw] max-w-[900px] -translate-y-1/2 opacity-[.07]"><Logo /></div>
          <div className="wrap grid flex-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
            <ol className="flex flex-col justify-center gap-1">
              {MENU.map((key, i) => (
                <li key={key} className="menu-item">
                  <TLink href={href(locale, key)} style={{ transitionDelay: open ? `${0.08 + i * 0.045}s` : '0s' }} tabIndex={open ? 0 : -1}>
                    <span className="num text-sm text-[var(--c-orange)]">{String(i + 1).padStart(2, '0')}</span>
                    <span className="menu-label h2 leading-[1.08]">{nav[key as keyof typeof nav]}</span>
                  </TLink>
                </li>
              ))}
            </ol>
            <div className="menu-fade flex flex-col justify-end gap-8 lg:pb-6">
              <p className="h3 italic-accent grad-text">{nav.menuTagline}</p>
              <div className="space-y-2 text-[var(--muted)]">
                <a className="block text-lg text-[var(--fg)] link-underline w-fit" href={`mailto:${settings.contact.email}`} tabIndex={open ? 0 : -1}>{settings.contact.email}</a>
                <a className="block w-fit link-underline" href={telLink(settings.contact.phonePrimary)} tabIndex={open ? 0 : -1}>{settings.contact.phonePrimary}</a>
                <a className="block w-fit link-underline" href={waLink(settings.contact.whatsapp[0]?.number ?? '')} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>WhatsApp</a>
                <p className="pt-2 text-sm">{settings.address.street}, {settings.address.district} — {settings.address.city}, {settings.address.country}</p>
              </div>
              <Socials settings={settings} />
              <div className="space-y-3">
                <ThemeSwitch locale={locale} tabIndex={open ? 0 : -1} />
                <a href="/admin" className="login-link w-fit" tabIndex={open ? 0 : -1}><UserLock size={18} /> {nav.login} · {nav.loginHint}</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {egg && (
        <div ref={eggRef} className="force-dark fixed inset-0 z-[160] grid place-items-center !bg-[rgb(7_10_23/.94)] p-6 text-center backdrop-blur" role="dialog" aria-modal="true" aria-label={easter.title} onClick={() => setEgg(false)}>
          <div>
            <div className="mx-auto mb-10 w-[min(70vw,360px)]"><Logo /></div>
            <div className="egg-text">
              <p className="kicker justify-center">7X</p>
              <p className="h1 mt-4 italic-accent grad-text">{easter.title}</p>
              <p className="lead mx-auto mt-4">{easter.text}</p>
              <button className="btn btn-primary mt-10" onClick={() => setEgg(false)}><span>{easter.close}</span><span className="btn-arrow"><Close size={14} /></span></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
