import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/content';
import { getPosts } from '@/lib/posts';
import { ROUTES, href, type RouteKey } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site';

const PRIORITY: Partial<Record<RouteKey, number>> = { home: 1, services: 0.9, work: 0.9, immo: 0.85, agency: 0.8, contact: 0.8, appointment: 0.8, quote: 0.8, news: 0.7, careers: 0.6 };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [fr, posts] = await Promise.all([getContent('fr'), getPosts('fr')]);
  const now = new Date();
  const entry = (key: RouteKey, sub?: string, priority = 0.7): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${href('fr', key, sub)}`,
    lastModified: now,
    changeFrequency: key === 'home' || key === 'work' ? 'weekly' : 'monthly',
    priority,
    alternates: { languages: { fr: `${SITE_URL}${href('fr', key, sub)}`, en: `${SITE_URL}${href('en', key, sub)}` } },
  });
  const pages = (Object.keys(ROUTES) as RouteKey[]).map((k) => entry(k, undefined, PRIORITY[k] ?? 0.3));
  const services = fr.services.items.map((s) => entry('services', s.slug, 0.8));
  const work = fr.work.items.map((p) => entry('work', p.slug, 0.7));
  const news = posts.map((p) => ({ ...entry('news', p.slug, 0.6), lastModified: new Date(p.updated) }));
  // Chaque URL est déclarée dans les deux langues
  return [...pages, ...services, ...work, ...news].flatMap((e) => [
    e,
    { ...e, url: e.alternates!.languages!.en as string },
  ]);
}
