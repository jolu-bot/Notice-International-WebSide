'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Content } from '@/content/fr';
import { useConsent } from '../consent/Consent';
import { Pin } from '../ui/Icons';

type Props = { t: Content['contactPage']; mapQuery: string; openMapLabel: string };

/**
 * Plan d'accès redessiné d'après le croquis de l'agence : les rues se tracent,
 * l'itinéraire depuis le rond-point de la Salle des Fêtes s'anime jusqu'à la porte.
 * La carte Google interactive n'est chargée qu'avec le consentement du visiteur.
 */
export function AccessMap({ t, mapQuery, openMapLabel }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const { consent, save } = useConsent();
  const [interactive, setInteractive] = useState(false);
  const lm = t.landmarks;

  useEffect(() => {
    const el = svg.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const route = el.querySelector<SVGPathElement>('.route-draw')!;
    const len = route.getTotalLength();
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
    const roads = el.querySelectorAll('.road');
    tl.set(roads, { strokeDasharray: 1400 })
      .fromTo(roads, { strokeDashoffset: 1400 }, { strokeDashoffset: 0, duration: 1.6, ease: 'expo.inOut', stagger: 0.12 })
      .from(el.querySelectorAll('.lm-g'), { autoAlpha: 0, y: 14, duration: 0.8, ease: 'expo.out', stagger: 0.08 }, 0.6)
      .fromTo(route, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut' }, 1.1)
      .set(route, { strokeDasharray: '10 10' })
      .from(el.querySelector('.here-g'), { scale: 0, transformOrigin: '50% 100%', duration: 1, ease: 'elastic.out(1, 0.5)' }, 3.2);
    gsap.to(route, { strokeDashoffset: -40, duration: 1.2, repeat: -1, ease: 'none', delay: 3.6 });
    return () => { tl.scrollTrigger?.kill(); tl.kill(); gsap.killTweensOf(route); };
  }, []);

  const embed = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=17&output=embed`;
  const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const showMap = interactive && consent.media;

  return (
    <div className="card overflow-hidden !rounded-[2rem]">
      <div className="relative aspect-[1286/860] w-full">
        {showMap ? (
          <iframe title={t.mapTitle} src={embed} className="map-frame absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        ) : (
          <svg ref={svg} viewBox="0 50 1286 860" className="access-map absolute inset-0 h-full w-full" role="img" aria-label={`${t.mapTitle} — ${t.mapLead}`}>
            <defs>
              <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="rgba(245,239,228,.08)" /></pattern>
            </defs>
            <rect x="0" y="50" width="1286" height="860" fill="url(#dots)" />
            {/* Rues */}
            <circle cx="150" cy="140" r="62" className="road" />
            <path d="M150 205 L150 900" className="road" />
            <path d="M150 402 L1286 402" className="road" />
            <path d="M888 402 L888 910" className="road" />
            <path d="M888 740 L1286 900" className="road" />
            {/* Hôpital Laquintinie */}
            <g className="lm-g">
              <polygon points="905,330 905,215 1085,140 1265,215 1265,330" fill="rgba(0,104,174,.18)" stroke="rgba(0,104,174,.7)" strokeWidth="2" />
              <path d="M1072 255h26M1085 242v26" stroke="#e2001a" strokeWidth="6" strokeLinecap="round" />
              <text x="1085" y="305" textAnchor="middle">{lm.hospital}</text>
            </g>
            <g className="lm-g"><text x="150" y="146" textAnchor="middle" style={{ fontSize: 11 }}>{lm.roundabout.split(' ').slice(0, 2).join(' ')}</text><text x="150" y="162" textAnchor="middle" style={{ fontSize: 11 }}>{lm.roundabout.split(' ').slice(2).join(' ')}</text></g>
            <g className="lm-g"><circle cx="560" cy="360" r="6" className="lm" /><text x="575" y="365">{lm.morgue}</text></g>
            <g className="lm-g"><circle cx="232" cy="455" r="6" className="lm" /><text x="246" y="460">{lm.bocom}</text></g>
            <g className="lm-g"><circle cx="830" cy="860" r="6" className="lm" /><text x="816" y="865" textAnchor="end">{lm.hotel}</text></g>
            <g className="lm-g"><text x="0" y="0" transform="translate(930 880) rotate(-90)" style={{ fill: 'rgba(245,239,228,.6)' }}>{lm.palais} ↓</text></g>
            <g className="lm-g"><text x="0" y="0" transform="translate(1040 800) rotate(22)" style={{ fill: 'rgba(245,239,228,.6)' }}>{lm.college} →</text></g>
            {/* Itinéraire */}
            <path d="M150 205 L150 402 L888 402 L888 575 L852 575" className="route route-draw" />
            <g className="here-g">
              <circle cx="830" cy="575" r="16" fill="#f39200" className="ping" />
              <circle cx="830" cy="575" r="12" fill="#f39200" stroke="#070a17" strokeWidth="4" />
              <rect x="600" y="500" width="215" height="46" rx="23" fill="#f5efe4" />
              <text x="707" y="529" textAnchor="middle" style={{ fill: '#070a17', fontSize: 15, fontWeight: 800 }}>{lm.here}</text>
            </g>
          </svg>
        )}
      </div>
      <div className="flex flex-col gap-4 border-t border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-[var(--muted)]"><Pin size={18} className="mt-0.5 flex-none text-[var(--c-orange)]" />{t.mapLead}</p>
        <div className="flex flex-wrap gap-2">
          {!showMap && (
            <button className="chip" onClick={() => { if (!consent.media) save({ analytics: consent.analytics, media: true }); setInteractive(true); }} title={t.mapConsent}>
              {t.mapLoad}
            </button>
          )}
          <a href={link} target="_blank" rel="noopener noreferrer" className="chip !bg-[var(--fg)] !text-[var(--bg)]">{openMapLabel}</a>
        </div>
      </div>
    </div>
  );
}
