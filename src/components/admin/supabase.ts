'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from '@/lib/site';

let client: SupabaseClient | null = null;

export function sb(): SupabaseClient {
  if (!hasSupabase) throw new Error('Supabase non configuré (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ni-admin' } });
  return client;
}

export const mediaUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;

export type Role = 'owner' | 'admin' | 'editor';
export type Profile = { id: string; email: string; full_name: string | null; role: Role; must_change_password: boolean; active: boolean; created_at: string; last_seen_at: string | null };
export type Submission = {
  id: string; kind: 'contact' | 'appointment' | 'quote' | 'career' | 'newsletter'; locale: string; name: string | null; email: string | null; phone: string | null;
  data: Record<string, unknown>; status: 'new' | 'in_progress' | 'done' | 'archived'; notes: string | null; created_at: string;
};

/** Publie immédiatement les changements sur le site public. */
export async function publish() {
  const { data } = await sb().auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;
  const r = await fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  return r.ok;
}

export function errorMessage(e: unknown): string {
  const raw = (e as { message?: string })?.message || String(e);
  const map: Record<string, string> = {
    forbidden: 'Action non autorisée pour votre rôle.',
    weak_password: 'Mot de passe trop court (10 caractères minimum).',
    email_exists: 'Un compte existe déjà avec cet e-mail.',
    invalid_email: 'Adresse e-mail invalide.',
    cannot_change_self: 'Vous ne pouvez pas modifier votre propre rôle ou statut.',
    'Invalid login credentials': 'Identifiants incorrects.',
    'User is banned': 'Ce compte est désactivé.',
  };
  for (const [k, v] of Object.entries(map)) if (raw.includes(k)) return v;
  return raw;
}

export function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const arr = new Uint32Array(14);
  crypto.getRandomValues(arr);
  const s = Array.from(arr, (n) => chars[n % chars.length]).join('');
  return `${s.slice(0, 5)}-${s.slice(5, 10)}-${s.slice(10)}!7x`;
}
