import 'server-only';
import type { NextRequest } from 'next/server';
import { SITE_URL } from './site';

/** Adresse IP du visiteur (derrière le proxy Vercel). */
export function clientIp(req: NextRequest) {
  return req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Refuse les requêtes envoyées depuis un autre site (CSRF, robots qui rejouent l'API) :
 * l'en-tête Origin doit correspondre au site lui-même, à son domaine public ou à une préversion Vercel du projet.
 */
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return req.headers.get('sec-fetch-site') === 'same-origin';
  let host: string;
  try { host = new URL(origin).host; } catch { return false; }
  const allowed = new Set([req.nextUrl.host, req.headers.get('host') ?? '', new URL(SITE_URL).host, new URL(SITE_URL).host.replace(/^www\./, '')]);
  if (process.env.VERCEL_URL) allowed.add(process.env.VERCEL_URL);
  if (process.env.VERCEL_BRANCH_URL) allowed.add(process.env.VERCEL_BRANCH_URL);
  if (process.env.NODE_ENV !== 'production') { allowed.add('localhost:3000'); allowed.add('127.0.0.1:3000'); }
  return allowed.has(host);
}

/** Refuse les corps de requête trop lourds avant même de les lire. */
export function tooLarge(req: NextRequest, maxBytes: number) {
  const len = Number(req.headers.get('content-length') || 0);
  return len > maxBytes;
}

/** Lit un corps JSON en imposant une taille maximale (même sans en-tête Content-Length). */
export async function readJson(req: NextRequest, maxBytes: number): Promise<unknown> {
  const text = await req.text();
  if (text.length > maxBytes) throw new Error('too_large');
  return JSON.parse(text);
}

const buckets = new Map<string, number[]>();
/** Limitation de débit glissante (par instance serveur) : `limit` requêtes par fenêtre `windowMs`. */
export function rateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const list = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  buckets.set(key, list);
  if (buckets.size > 10000) buckets.clear();
  return list.length > limit;
}
