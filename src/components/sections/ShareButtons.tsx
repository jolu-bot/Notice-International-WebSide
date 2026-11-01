'use client';

import { useState } from 'react';
import { Facebook, LinkedIn, WhatsApp, XLogo } from '../ui/Icons';

/** Partage d'un article : réseaux du public camerounais en premier (WhatsApp), puis lien à copier. */
export function ShareButtons({ url, title, label, copy: copyLabel, copied }: { url: string; title: string; label: string; copy: string; copied: string }) {
  const [done, setDone] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}`, Icon: WhatsApp },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, Icon: Facebook },
    { name: 'X', href: `https://x.com/intent/post?text=${t}&url=${u}`, Icon: XLogo },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, Icon: LinkedIn },
  ];
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setDone(true); window.setTimeout(() => setDone(false), 2200); } catch { /* presse-papiers indisponible */ }
  };
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map(({ name, href, Icon }) => (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} — ${name}`}
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] transition-colors duration-500 hover:border-transparent hover:bg-[var(--c-orange)] hover:text-[var(--c-ink)]">
            <Icon size={18} />
          </a>
        ))}
        <button type="button" onClick={copy} className="chip !py-2 !text-xs">{done ? `✓ ${copied}` : copyLabel}</button>
      </div>
    </div>
  );
}
