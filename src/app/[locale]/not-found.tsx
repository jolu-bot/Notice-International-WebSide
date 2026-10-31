'use client';

import { usePathname } from 'next/navigation';
import { fr } from '@/content/fr';
import { en } from '@/content/en';
import { Logo } from '@/components/brand/Logo';
import { Btn } from '@/components/fx/TLink';

export default function NotFound() {
  const pathname = usePathname() || '';
  const locale = pathname.startsWith('/en') ? 'en' : 'fr';
  const t = (locale === 'en' ? en : fr).notFound;
  return (
    <section className="theme-dark relative grid min-h-[90svh] place-items-center overflow-hidden pt-[var(--header-h)]">
      <div className="wrap relative text-center">
        <div className="mx-auto w-[min(60vw,320px)] animate-[pulse_3s_ease-in-out_infinite]"><Logo /></div>
        <p className="stat-num mt-10 grad-text">404</p>
        <h1 className="h2 mx-auto mt-6 max-w-[18ch]">{t.title}</h1>
        <p className="lead mx-auto mt-6 text-center">{t.text}</p>
        <div className="mt-10 flex justify-center"><Btn href={`/${locale}`}>{t.cta}</Btn></div>
      </div>
    </section>
  );
}
