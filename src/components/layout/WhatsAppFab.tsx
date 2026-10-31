'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Content } from '@/content/fr';
import type { Settings } from '@/content/settings';
import { waLink } from '@/lib/utils';
import { Close, WhatsApp } from '../ui/Icons';

/** Bouton WhatsApp flottant : conversation directe avec la Direction ou l'Assistance. */
export function WhatsAppFab({ t, settings }: { t: Content['whatsapp']; settings: Settings }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !panel.current) return;
    gsap.fromTo(panel.current, { scale: 0.6, autoAlpha: 0, y: 20 }, { scale: 1, autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' });
    gsap.fromTo(panel.current.querySelectorAll('li'), { x: 20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6, ease: 'expo.out', delay: 0.15 });
    const onDoc = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const message = `${t.message}…`;
  return (
    <div ref={wrap} className="wa-fab">
      {open && (
        <div ref={panel} className="wa-panel" role="dialog" aria-label={t.fab}>
          <div className="bg-[#075e54] p-5 text-white">
            <p className="text-lg font-bold">{t.title}</p>
            <p className="text-sm opacity-80">{t.text}</p>
          </div>
          <ul className="divide-y divide-black/5 p-2">
            {settings.contact.whatsapp.map((w) => (
              <li key={w.number}>
                <a href={waLink(w.number, message)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-black/5">
                  <span className="relative grid h-12 w-12 flex-none place-items-center rounded-full bg-[#25d366] text-lg font-bold text-white">
                    {w.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#25d366]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold">{w.name}</span>
                    <span className="block text-sm text-black/60">{w.label} · +{w.number.replace(/^(\d{3})(\d{3})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5')}</span>
                  </span>
                  <WhatsApp size={22} className="ml-auto flex-none text-[#25d366]" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button className="wa-btn relative" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t.fab} data-magnetic="0.4">
        {!open && <span className="wa-pulse" />}
        {open ? <Close size={24} /> : <WhatsApp size={30} />}
      </button>
    </div>
  );
}
