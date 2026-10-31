'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

export function StepsBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-12">
      <div className="steps-bar" aria-hidden>
        {steps.map((s, i) => <div key={s} className={cn(i <= current && 'is-done')}><i /></div>)}
      </div>
      <ol className="mt-4 grid grid-flow-col gap-2 text-xs font-bold uppercase tracking-[.16em]">
        {steps.map((s, i) => (
          <li key={s} className={cn('transition-colors', i === current ? 'text-[var(--fg)]' : 'text-[var(--muted)]')} aria-current={i === current ? 'step' : undefined}>
            <span className="num mr-2 text-[var(--c-orange)]">{String(i + 1).padStart(2, '0')}</span>
            <span className="hidden sm:inline">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Conteneur d'étape animé : glisse et apparaît à chaque changement. */
export function StepPanel({ step, children, direction }: { step: number; children: ReactNode; direction: 1 | -1 }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(ref.current, { autoAlpha: 0, x: 50 * direction }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'expo.out' });
    ref.current.querySelector<HTMLElement>('input, textarea, button')?.focus({ preventScroll: true });
  }, [step, direction]);
  return <div ref={ref}>{children}</div>;
}
