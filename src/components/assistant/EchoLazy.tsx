'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, type ComponentProps } from 'react';
import type { Echo as EchoType } from './Echo';

const Echo = dynamic(() => import('./Echo').then((m) => m.Echo), { ssr: false });

/** Écho n'est chargé qu'une fois la page affichée et le navigateur au repos : aucun impact sur le premier rendu. */
export function EchoLazy(props: ComponentProps<typeof EchoType>) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 3500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setReady(true), 1800);
    return () => window.clearTimeout(id);
  }, []);
  return ready ? <Echo {...props} /> : null;
}
