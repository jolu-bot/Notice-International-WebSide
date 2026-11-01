'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { Markdown } from '../ui/Markdown';
import { errorMessage, publish, sb } from './supabase';
import { AdminButton, ImageField, Spinner, useToast } from './ui';

type Post = {
  id: string; slug: string; category: string; cover: string; published: boolean; published_at: string; updated_at: string; author_email: string | null;
  title_fr: string; title_en: string; excerpt_fr: string; excerpt_en: string; body_fr: string; body_en: string;
};

const CATEGORIES: Record<string, string> = { agence: 'L’agence', evenement: 'Événements', realisation: 'Réalisations', conseil: 'Conseils', immo: 'Immo & Building' };
const EMPTY: Omit<Post, 'id' | 'updated_at' | 'author_email'> = {
  slug: '', category: 'agence', cover: '', published: false, published_at: new Date().toISOString(),
  title_fr: '', title_en: '', excerpt_fr: '', excerpt_en: '', body_fr: '', body_en: '',
};

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const toLocalInput = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const status = (p: Pick<Post, 'published' | 'published_at'>) => (!p.published ? 'Brouillon' : new Date(p.published_at) > new Date() ? 'Programmé' : 'En ligne');

/** Actualités : liste, rédaction bilingue avec aperçu, publication immédiate ou programmée. */
export function Posts({ canDelete }: { canDelete: boolean }) {
  const toast = useToast();
  const [rows, setRows] = useState<Post[] | null>(null);
  const [edit, setEdit] = useState<(typeof EMPTY & { id?: string }) | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await sb().from('posts').select('*').order('published_at', { ascending: false });
    if (error) toast(errorMessage(error), 'err');
    setRows((data as Post[]) ?? []);
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  if (edit) return <Editor initial={edit} canDelete={canDelete} onClose={() => { setEdit(null); load(); }} />;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h3">Actualités</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Campagnes, événements, chantiers, conseils : chaque article est publié en français et, si vous le souhaitez, en anglais.</p>
        </div>
        <AdminButton tone="primary" onClick={() => setEdit({ ...EMPTY, published_at: new Date().toISOString() })}>+ Nouvel article</AdminButton>
      </div>
      <ul className="mt-8 space-y-2">
        {rows === null ? <Spinner /> : !rows.length ? <li className="text-[var(--muted)]">Aucun article pour l’instant.</li> : rows.map((p) => (
          <li key={p.id}>
            <button onClick={() => setEdit(p)} className="card flex w-full items-center gap-4 p-3 text-left transition-colors hover:!border-[var(--fg)]">
              <span className="h-16 w-24 flex-none overflow-hidden rounded-lg bg-[var(--card)]">
                {p.cover && <img src={p.cover.startsWith('/images/') ? `${p.cover}-800.webp` : p.cover} alt="" className="h-full w-full object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{p.title_fr}</span>
                <span className="block truncate text-xs text-[var(--muted)]">{CATEGORIES[p.category]} · {new Date(p.published_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}{p.title_en ? ' · FR + EN' : ' · FR'}</span>
              </span>
              <span className={cn('flex-none rounded-full px-3 py-1 text-xs font-bold', status(p) === 'En ligne' ? 'bg-[#25d366]/15 text-[#25d366]' : status(p) === 'Programmé' ? 'bg-[var(--c-orange)]/15 text-[var(--c-orange)]' : 'bg-[var(--card)] text-[var(--muted)]')}>{status(p)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Editor({ initial, canDelete, onClose }: { initial: typeof EMPTY & { id?: string }; canDelete: boolean; onClose: () => void }) {
  const toast = useToast();
  const [p, setP] = useState(initial);
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const set = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) => setP((x) => ({ ...x, [k]: v }));

  const onTitle = (v: string) => {
    setP((x) => ({ ...x, title_fr: v, ...(slugTouched ? {} : { slug: slugify(v) }) }));
  };

  const save = async (e?: FormEvent, publishNow?: boolean) => {
    e?.preventDefault();
    if (p.title_fr.trim().length < 3) return toast('Donnez un titre en français (3 caractères minimum).', 'err');
    const slug = slugify(p.slug || p.title_fr);
    if (!slug) return toast('Adresse de l’article invalide.', 'err');
    setBusy(true);
    const row = { slug, category: p.category, cover: p.cover.trim(), published: publishNow ?? p.published, published_at: p.published_at,
      title_fr: p.title_fr.trim(), title_en: p.title_en.trim(), excerpt_fr: p.excerpt_fr.trim(), excerpt_en: p.excerpt_en.trim(), body_fr: p.body_fr, body_en: p.body_en };
    const { data, error } = p.id
      ? await sb().from('posts').update(row).eq('id', p.id).select('id').single()
      : await sb().from('posts').insert(row).select('id').single();
    if (error) { setBusy(false); return toast(error.message.includes('duplicate') ? 'Un article utilise déjà cette adresse : modifiez-la.' : errorMessage(error), 'err'); }
    await publish();
    setBusy(false);
    setP((x) => ({ ...x, ...row, id: (data as { id: string }).id }));
    setSlugTouched(true);
    toast(row.published ? 'Article enregistré et publié.' : 'Brouillon enregistré.');
  };

  const remove = async () => {
    if (!p.id || !window.confirm('Supprimer définitivement cet article ?')) return;
    const { error } = await sb().from('posts').delete().eq('id', p.id);
    if (error) return toast(errorMessage(error), 'err');
    await publish();
    toast('Article supprimé.');
    onClose();
  };

  const title = lang === 'fr' ? p.title_fr : p.title_en;
  const excerpt = lang === 'fr' ? p.excerpt_fr : p.excerpt_en;
  const body = lang === 'fr' ? p.body_fr : p.body_en;
  const publicUrl = `/${lang === 'fr' ? 'fr/actualites' : 'en/news'}/${p.slug}`;

  return (
    <form onSubmit={save} className="max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onClose} className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--fg)]">← Tous les articles</button>
        <div className="flex flex-wrap gap-2">
          {p.id && p.published && <a href={publicUrl} target="_blank" rel="noopener" className="chip !py-1.5 !text-xs">Voir l’article ↗</a>}
          {p.id && canDelete && <AdminButton small tone="danger" onClick={remove}>Supprimer</AdminButton>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="flex gap-2" role="tablist" aria-label="Langue">
          {(['fr', 'en'] as const).map((l) => (
            <button key={l} type="button" role="tab" aria-selected={lang === l} className="chip" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l === 'fr' ? 'Français' : 'English'}{l === 'en' && !p.title_en && <span className="text-[var(--muted)]">(facultatif)</span>}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <button type="button" role="switch" aria-checked={p.published} className="switch" onClick={() => set('published', !p.published)} />
          {p.published ? 'Publié' : 'Brouillon'}
        </label>
      </div>

      <label className="field block">
        <span className="field-label">Titre {lang === 'fr' ? '(obligatoire)' : '— version anglaise'}</span>
        <input className="field-input !text-2xl" value={title} maxLength={160} onChange={(e) => (lang === 'fr' ? onTitle(e.target.value) : set('title_en', e.target.value))} />
        <span className="field-line" />
      </label>
      <label className="field block">
        <span className="field-label">Chapeau — 2 ou 3 phrases d’accroche (affiché sur la carte et sous le titre)</span>
        <textarea className="field-input" rows={2} maxLength={400} value={excerpt} onChange={(e) => set(lang === 'fr' ? 'excerpt_fr' : 'excerpt_en', e.target.value)} />
        <span className="field-line" />
      </label>

      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="field-label !mb-0">Texte de l’article</span>
          <button type="button" className="chip !py-1 !text-xs" aria-pressed={preview} onClick={() => setPreview((v) => !v)}>{preview ? 'Modifier' : 'Aperçu'}</button>
        </div>
        {preview ? (
          <div className="card mt-3 p-6"><Markdown source={body || '*Rien à afficher pour l’instant.*'} className="prose-ni" /></div>
        ) : (
          <textarea className="field-input mt-3 !min-h-[22rem] rounded-xl border border-[var(--line)] !p-4 !text-base" value={body} maxLength={40000} onChange={(e) => set(lang === 'fr' ? 'body_fr' : 'body_en', e.target.value)}
            placeholder={'Écrivez votre article…\n\n## Un intertitre\nUn paragraphe avec du **gras**, de l’*italique* et un [lien](https://www.noticeinternational.com).\n\n- un point\n- un autre point'} />
        )}
        <p className="mt-2 text-xs text-[var(--muted)]">Mise en forme : « ## Intertitre », « - élément de liste », **gras**, *italique*, [texte du lien](https://…). Une ligne vide sépare les paragraphes.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <ImageField label="Image de couverture" value={p.cover} onChange={(v) => set('cover', v)} />
        <div className="space-y-6">
          <label className="field block">
            <span className="field-label">Catégorie</span>
            <select className="field-input" value={p.category} onChange={(e) => set('category', e.target.value)}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="field block">
            <span className="field-label">Date de publication (une date future programme l’article)</span>
            <input type="datetime-local" className="field-input" value={toLocalInput(p.published_at)} onChange={(e) => e.target.value && set('published_at', new Date(e.target.value).toISOString())} />
            <span className="field-line" />
          </label>
          <label className="field block">
            <span className="field-label">Adresse de l’article</span>
            <input className="field-input !text-sm" value={p.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} placeholder="mon-article" />
            <span className="mt-1 block text-xs text-[var(--muted)]">noticeinternational.com/fr/actualites/<strong>{p.slug || '…'}</strong></span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-6">
        <AdminButton type="submit" tone="primary" disabled={busy}>{busy && <Spinner />} Enregistrer</AdminButton>
        {!p.published && <AdminButton disabled={busy} onClick={() => save(undefined, true)}>Enregistrer et publier</AdminButton>}
      </div>
    </form>
  );
}
