import 'server-only';
import { cache } from 'react';
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from './site';
import { frenchTypography } from './utils';
import type { Locale } from './i18n';

/** Actualités : rédigées dans /admin → Actualités, publiées instantanément (même étiquette de cache que les contenus). */
export const POST_CATEGORIES = ['agence', 'evenement', 'realisation', 'conseil', 'immo'] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];

type Row = {
  slug: string; category: PostCategory; cover: string; published_at: string; updated_at: string;
  title_fr: string; title_en: string; excerpt_fr: string; excerpt_en: string; body_fr: string; body_en: string;
};

export type Post = {
  slug: string; category: PostCategory; cover: string; date: string; updated: string;
  title: string; excerpt: string; body: string; minutes: number;
};

const fetchRows = cache(async (): Promise<Row[]> => {
  if (!hasSupabase) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=slug,category,cover,published_at,updated_at,title_fr,title_en,excerpt_fr,excerpt_en,body_fr,body_en&order=published_at.desc&limit=200`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      cache: 'force-cache',
      next: { tags: ['content'], revalidate: 3600 },
    });
    if (!res.ok) return [];
    return (await res.json()) as Row[];
  } catch {
    return [];
  }
});

function localize(r: Row, locale: Locale): Post {
  // Version anglaise absente : on affiche la version française plutôt qu'un article vide
  const en = locale === 'en' && r.title_en.trim();
  const pick = (frText: string, enText: string) => (en && enText.trim() ? enText : frText);
  const fix = (s: string) => (locale === 'fr' || !en ? frenchTypography(s) : s);
  const body = fix(pick(r.body_fr, r.body_en));
  return {
    slug: r.slug, category: r.category, cover: r.cover, date: r.published_at, updated: r.updated_at,
    title: fix(pick(r.title_fr, r.title_en)),
    excerpt: fix(pick(r.excerpt_fr, r.excerpt_en)),
    body,
    minutes: Math.max(1, Math.round(body.split(/\s+/).length / 220)),
  };
}

export async function getPosts(locale: Locale, limit?: number): Promise<Post[]> {
  const rows = await fetchRows();
  const list = rows.map((r) => localize(r, locale));
  return limit ? list.slice(0, limit) : list;
}

export async function getPost(locale: Locale, slug: string): Promise<Post | null> {
  const rows = await fetchRows();
  const row = rows.find((r) => r.slug === slug);
  return row ? localize(row, locale) : null;
}

export const coverUrl = (cover: string) => (cover.startsWith('/images/') ? `${cover}-1600.webp` : cover);
