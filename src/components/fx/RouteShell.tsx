'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Chaque page vit dans son propre conteneur, recréé à chaque changement d'adresse.
 * Les animations (découpage des titres, épinglages) modifient le DOM : React ne doit
 * jamais tenter de réconcilier une page ainsi transformée — il retire simplement
 * l'ancien conteneur, qui lui appartient toujours.
 */
export function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div key={pathname}>{children}</div>;
}
