import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Notice International — Agence conseil en marketing & communication',
    short_name: 'Notice Intl',
    description: 'Cette fois, faites-vous écouter. Stratégie, création, événementiel, terrain, digital — et BTP, énergie & immobilier avec Notice Immo & Building.',
    start_url: '/fr',
    display: 'standalone',
    background_color: '#070a17',
    theme_color: '#070a17',
    lang: 'fr',
    categories: ['business', 'marketing'],
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
