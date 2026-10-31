import 'server-only';
import { cache } from 'react';
import { fr, type Content } from '@/content/fr';
import { en } from '@/content/en';
import { settings as defaultSettings, type Settings } from '@/content/settings';
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from './site';
import { deepMerge, frenchTypography, mapStrings } from './utils';
import type { Locale } from './i18n';

type Row = { section: string; locale: 'fr' | 'en' | 'all'; data: unknown };

const DEFAULTS: Record<Locale, Content> = { fr, en };

/** Lit les surcharges éditées dans /admin. Mises en cache et invalidées à chaque enregistrement. */
const fetchOverrides = cache(async (): Promise<Row[]> => {
  if (!hasSupabase) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/content?select=section,locale,data`, {
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

export const getContent = cache(async (locale: Locale): Promise<Content> => {
  const rows = await fetchOverrides();
  let content: Content = DEFAULTS[locale];
  for (const row of rows) {
    if (row.locale !== locale || !(row.section in content)) continue;
    const key = row.section as keyof Content;
    content = { ...content, [key]: deepMerge(content[key], row.data) };
  }
  return locale === 'fr' ? mapStrings(content, frenchTypography) : content;
});

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await fetchOverrides();
  const row = rows.find((r) => r.section === 'settings' && r.locale === 'all');
  return row ? deepMerge(defaultSettings, row.data) : defaultSettings;
});

export function yearsSince(year: string) {
  return new Date().getFullYear() - Number(year || 2000);
}
