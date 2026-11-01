import type { NextConfig } from 'next';

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;
const dev = process.env.NODE_ENV !== 'production';

/**
 * Politique de sécurité du contenu : seules les ressources de ce site, de Supabase (contenus,
 * médias, connexion à l'administration) et la carte Google sont autorisées. Aucun script tiers.
 */
function csp(frameAncestors: string) {
  const supa = supabaseHost ? ` https://${supabaseHost} wss://${supabaseHost}` : '';
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'${dev ? ` 'unsafe-eval'` : ''}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `media-src 'self' blob: https:`,
    `font-src 'self' data:`,
    `connect-src 'self'${supa}`,
    `frame-src https://www.google.com https://maps.google.com`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors ${frameAncestors}`,
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp(`'self'`) },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Micro autorisé pour ce site uniquement : dictée vocale de l'assistant, sur action du visiteur
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const adminHeaders = [
  { key: 'Content-Security-Policy', value: csp(`'none'`) },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  { key: 'Cache-Control', value: 'no-store, max-age=0' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
];

// Machines modestes : LOW_MEMORY_BUILD=1 limite le parallélisme (le typage est vérifié séparément par `npm run lint`)
const lowMemory = process.env.LOW_MEMORY_BUILD === '1';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  ...(lowMemory ? { experimental: { cpus: 1, workerThreads: false, memoryBasedWorkersCount: true }, typescript: { ignoreBuildErrors: true } } : {}),
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: supabaseHost ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }] : [],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/admin', headers: adminHeaders },
      { source: '/admin/:path*', headers: adminHeaders },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex' }] },
    ];
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      { source: '/accueil', destination: '/fr', permanent: true },
      // Accès à l'espace d'administration par des adresses faciles à retenir
      ...['/connexion', '/login', '/espace-equipe', '/:locale(fr|en)/connexion', '/:locale(fr|en)/login', '/:locale(fr|en)/espace-equipe', '/:locale(fr|en)/admin', '/administration']
        .map((source) => ({ source, destination: '/admin', permanent: false })),
    ];
  },
};

export default nextConfig;
