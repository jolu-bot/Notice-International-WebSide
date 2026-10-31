'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { useExperience } from './Experience';
import { ArrowRight } from '../ui/Icons';
import { cn } from '@/lib/utils';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode; prefetch?: boolean };

/** Lien interne avec transition « rideau mosaïque ». */
export function TLink({ href, onClick, children, prefetch, ...rest }: Props) {
  const { navigate, scrollTo } = useExperience();
  const pathname = usePathname();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || rest.target === '_blank') return;
    const [path, hash] = href.split('#');
    if (!path || path === pathname) {
      if (hash) { e.preventDefault(); scrollTo(`#${hash}`); history.replaceState(null, '', `#${hash}`); }
      else if (path === pathname) { e.preventDefault(); scrollTo(0); }
      return;
    }
    e.preventDefault();
    navigate(href);
  };
  return (
    <Link href={href} onClick={handle} prefetch={prefetch} {...rest}>
      {children}
    </Link>
  );
}

type BtnProps = { href: string; children: ReactNode; variant?: 'primary' | 'ghost'; size?: 'md' | 'sm'; className?: string; external?: boolean; cursor?: string };

export function Btn({ href, children, variant = 'primary', size = 'md', className, external, cursor }: BtnProps) {
  const cls = cn('btn', variant === 'primary' ? 'btn-primary' : 'btn-ghost', size === 'sm' && 'btn-sm', className);
  const inner = (
    <>
      <span>{children}</span>
      <span className="btn-arrow"><ArrowRight size={15} /><ArrowRight size={15} /></span>
    </>
  );
  if (external || href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:'))
    return <a href={href} className={cls} data-magnetic="0.25" data-cursor={cursor} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{inner}</a>;
  return <TLink href={href} className={cls} data-magnetic="0.25" data-cursor={cursor}>{inner}</TLink>;
}
