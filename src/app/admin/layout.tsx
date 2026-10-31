import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Manrope } from 'next/font/google';
import '../globals.css';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', axes: ['opsz', 'SOFT', 'WONK'], style: ['normal', 'italic'], display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

export const metadata: Metadata = {
  title: 'Administration · Notice International',
  robots: { index: false, follow: false, nocache: true },
};
export const viewport: Viewport = { themeColor: '#070a17', colorScheme: 'dark' };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="theme-dark">{children}</body>
    </html>
  );
}
