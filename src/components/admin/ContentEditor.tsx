'use client';

import { useEffect, useMemo, useState } from 'react';
import { fr } from '@/content/fr';
import { en } from '@/content/en';
import { settings as defaultSettings } from '@/content/settings';
import { cn, deepMerge, isPlainObject } from '@/lib/utils';
import { imgUrl } from '../ui/Picture';
import { ArrowLeft } from '../ui/Icons';
import { SECTION_GROUPS, fieldLabel, isGalleryKey, isImageKey, isLongText } from './labels';
import { errorMessage, publish, sb } from './supabase';
import { AdminButton, ImageField, MediaPicker, Modal, Spinner, useToast, uploadFile } from './ui';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type Loc = 'fr' | 'en' | 'all';

const DEFAULTS = { fr, en } as unknown as Record<'fr' | 'en', Record<string, Json>>;
const CATEGORIES = ['strategie', 'creation', 'evenementiel', 'terrain', 'talents'];

/** Gabarit vide à partir d'un élément existant (pour « Ajouter »). */
function blank(v: Json): Json {
  if (typeof v === 'string') return '';
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  if (Array.isArray(v)) return [];
  if (isPlainObject(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x as Json)]));
  return null;
}
const itemTitle = (v: Json, i: number) => {
  if (isPlainObject(v)) {
    const o = v as Record<string, Json>;
    const t = o.title ?? o.name ?? o.q ?? o.year ?? o.label ?? o.client;
    if (typeof t === 'string' && t) return t;
  }
  return `Élément ${i + 1}`;
};

/* ─── Éditeur récursif ───────────────────────────────────────────── */
function NodeEditor({ name, value, template, onChange, depth }: { name: string; value: Json; template: Json; onChange: (v: Json) => void; depth: number }) {
  const label = fieldLabel(name);

  if (typeof value === 'string') {
    if (isImageKey(name)) return <ImageField label={label} value={value} onChange={onChange} />;
    if (name === 'category') return <SelectField label={label} value={value} options={CATEGORIES} onChange={onChange} />;
    if (name === 'universe') return <SelectField label={label} value={value} options={['com', 'immo']} onChange={onChange} />;
    const long = isLongText(name, value);
    return (
      <label className="field block">
        <span className="field-label">{label}</span>
        {long ? (
          <textarea className="field-input !text-base" rows={name === 'body' ? 18 : Math.min(8, Math.max(3, Math.ceil(value.length / 90)))} value={value} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input className="field-input !text-base" value={value} onChange={(e) => onChange(e.target.value)} />
        )}
        <span className="field-line" />
      </label>
    );
  }
  if (typeof value === 'number') return (
    <label className="field block"><span className="field-label">{label}</span><input type="number" className="field-input" value={value} onChange={(e) => onChange(Number(e.target.value))} /><span className="field-line" /></label>
  );

  if (Array.isArray(value)) {
    const sample = (Array.isArray(template) && template[0] !== undefined ? template[0] : value[0]) ?? '';
    if (isGalleryKey(name)) return <GalleryEditor label={label} value={value as string[]} onChange={onChange} />;
    if (typeof sample === 'string') return <StringList label={label} value={value as string[]} onChange={onChange} />;
    return <ObjectList name={name} label={label} value={value} sample={sample} onChange={onChange} depth={depth} />;
  }

  if (isPlainObject(value)) {
    const obj = value as Record<string, Json>;
    const tpl = (isPlainObject(template) ? template : {}) as Record<string, Json>;
    const body = (
      <div className="grid gap-7">
        {Object.entries(obj).map(([k, v]) => (
          <NodeEditor key={k} name={k} value={v} template={tpl[k] ?? v} depth={depth + 1} onChange={(nv) => onChange({ ...obj, [k]: nv })} />
        ))}
      </div>
    );
    if (depth === 0) return body;
    return (
      <details className="rounded-2xl border border-[var(--line)] bg-white/[.02] p-5" open={depth < 2}>
        <summary className="cursor-pointer select-none font-bold">{label}</summary>
        <div className="mt-6">{body}</div>
      </details>
    );
  }
  return null;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="field block">
      <span className="field-label">{label}</span>
      <select className="field-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {!options.includes(value) && <option value={value}>{value || '—'}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="field-line" />
    </label>
  );
}

const move = <T,>(arr: T[], i: number, d: number) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; };

function StringList({ label, value, onChange }: { label: string; value: string[]; onChange: (v: Json) => void }) {
  return (
    <div>
      <p className="field-label">{label} <span className="text-[var(--muted)]">({value.length})</span></p>
      <ul className="mt-2 space-y-2">
        {value.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <input className="field-input !py-2 !text-base" value={s} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" className="lb-btn !h-8 !w-8 text-xs" onClick={() => onChange(move(value, i, -1))} aria-label="Monter">↑</button>
            <button type="button" className="lb-btn !h-8 !w-8 text-xs" onClick={() => onChange(move(value, i, 1))} aria-label="Descendre">↓</button>
            <button type="button" className="lb-btn !h-8 !w-8 text-xs text-[#ff9b9b]" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Supprimer">✕</button>
          </li>
        ))}
      </ul>
      <button type="button" className="chip mt-3" onClick={() => onChange([...value, ''])}>+ Ajouter</button>
    </div>
  );
}

function GalleryEditor({ label, value, onChange }: { label: string; value: string[]; onChange: (v: Json) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadFile(f));
      onChange([...value, ...urls]);
      toast(`${urls.length} image(s) ajoutée(s).`);
    } catch (e) { toast(errorMessage(e), 'err'); } finally { setBusy(false); }
  };
  return (
    <div>
      <p className="field-label">{label} <span className="text-[var(--muted)]">({value.length})</span></p>
      <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {value.map((src, i) => (
          <li key={src + i} className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--line)]">
            <img src={imgUrl(src, 800)} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button type="button" className="px-2 text-xs" onClick={() => onChange(move(value, i, -1))}>←</button>
              <button type="button" className="px-2 text-xs" onClick={() => onChange(move(value, i, 1))}>→</button>
              <button type="button" className="px-2 text-xs text-[#ff9b9b]" onClick={() => onChange(value.filter((_, j) => j !== i))}>✕</button>
            </div>
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-[var(--c-orange)] px-1.5 text-[10px] font-bold text-black">1re</span>}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="chip cursor-pointer">{busy ? <Spinner /> : '⬆'} Envoyer des images<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} /></label>
        <button type="button" className="chip" onClick={() => setPicker(true)}>Médiathèque</button>
      </div>
      {picker && <MediaPicker onClose={() => setPicker(false)} onPick={(url) => { onChange([...value, url]); setPicker(false); }} />}
    </div>
  );
}

function ObjectList({ name, label, value, sample, onChange, depth }: { name: string; label: string; value: Json[]; sample: Json; onChange: (v: Json) => void; depth: number }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      <p className="field-label">{label} <span className="text-[var(--muted)]">({value.length})</span></p>
      <ul className="mt-3 space-y-2">
        {value.map((item, i) => (
          <li key={i} className="rounded-2xl border border-[var(--line)] bg-white/[.02]">
            <div className="flex items-center gap-2 p-3 pl-5">
              <button type="button" className="min-w-0 flex-1 truncate text-left font-semibold" onClick={() => setOpen(open === i ? null : i)}>
                <span className="mr-2 text-[var(--c-orange)]">{open === i ? '▾' : '▸'}</span>{itemTitle(item, i)}
              </button>
              <button type="button" className="lb-btn !h-8 !w-8 text-xs" onClick={() => onChange(move(value, i, -1))} aria-label="Monter">↑</button>
              <button type="button" className="lb-btn !h-8 !w-8 text-xs" onClick={() => onChange(move(value, i, 1))} aria-label="Descendre">↓</button>
              <button type="button" className="lb-btn !h-8 !w-8 text-xs" title="Dupliquer" onClick={() => onChange([...value.slice(0, i + 1), JSON.parse(JSON.stringify(item)), ...value.slice(i + 1)])}>⧉</button>
              <button type="button" className="lb-btn !h-8 !w-8 text-xs text-[#ff9b9b]" onClick={() => { if (confirm('Supprimer cet élément ?')) onChange(value.filter((_, j) => j !== i)); }} aria-label="Supprimer">✕</button>
            </div>
            {open === i && (
              <div className="border-t border-[var(--line)] p-5">
                <NodeEditor name={name} value={item} template={sample} depth={0} onChange={(nv) => onChange(value.map((x, j) => (j === i ? nv : x)))} />
              </div>
            )}
          </li>
        ))}
      </ul>
      <button type="button" className="chip mt-3" onClick={() => { onChange([...value, blank(sample)]); setOpen(value.length); }}>+ Ajouter</button>
    </div>
  );
}

/* ─── Écran d'édition d'une section ──────────────────────────────── */
type Revision = { id: number; data: Json; author_email: string | null; created_at: string };

export function SectionEditor({ section, initialLocale, onBack }: { section: string; initialLocale: Loc; onBack: () => void }) {
  const toast = useToast();
  const isSettings = section === 'settings';
  const [locale, setLocale] = useState<Loc>(isSettings ? 'all' : initialLocale === 'all' ? 'fr' : initialLocale);
  const defaults = useMemo<Json>(() => (isSettings ? (defaultSettings as unknown as Json) : DEFAULTS[locale as 'fr' | 'en'][section]), [isSettings, locale, section]);
  const [value, setValue] = useState<Json | null>(null);
  const [saved, setSaved] = useState('');
  const [hasOverride, setHasOverride] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const meta = SECTION_GROUPS.flatMap((g) => g.sections).find((s) => s.key === section);

  useEffect(() => {
    let cancel = false;
    setValue(null);
    sb().from('content').select('data').eq('section', section).eq('locale', locale).maybeSingle().then(({ data, error }) => {
      if (cancel) return;
      if (error) toast(errorMessage(error), 'err');
      const merged = data?.data ? deepMerge(defaults, data.data) : defaults;
      setHasOverride(!!data);
      setValue(merged);
      setSaved(JSON.stringify(merged));
    });
    return () => { cancel = true; };
  }, [section, locale, defaults, toast]);

  const dirty = value !== null && JSON.stringify(value) !== saved;
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = async () => {
    if (value === null) return;
    setBusy(true);
    const { error } = await sb().from('content').upsert({ section, locale, data: value }, { onConflict: 'section,locale' });
    if (error) { toast(errorMessage(error), 'err'); setBusy(false); return; }
    setSaved(JSON.stringify(value)); setHasOverride(true);
    const ok = await publish();
    setBusy(false);
    toast(ok ? 'Enregistré et publié sur le site ✓' : 'Enregistré. La publication se fera sous une heure.');
  };

  const reset = async () => {
    if (!confirm('Revenir aux textes d’origine pour cette section ? (L’historique reste disponible.)')) return;
    setBusy(true);
    const { error } = await sb().from('content').delete().eq('section', section).eq('locale', locale);
    if (error) { toast(errorMessage(error), 'err'); setBusy(false); return; }
    setValue(defaults); setSaved(JSON.stringify(defaults)); setHasOverride(false);
    await publish();
    setBusy(false);
    toast('Section réinitialisée.');
  };

  const openRevisions = async () => {
    setRevisions([]);
    const { data, error } = await sb().from('content_revisions').select('id,data,author_email,created_at').eq('section', section).eq('locale', locale).order('created_at', { ascending: false }).limit(30);
    if (error) toast(errorMessage(error), 'err');
    setRevisions((data as Revision[]) ?? []);
  };

  const preview = meta?.preview !== undefined ? `/${locale === 'en' ? 'en' : 'fr'}${meta.preview ? `/${meta.preview}` : ''}` : null;

  return (
    <div>
      <button className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--fg)]" onClick={() => { if (!dirty || confirm('Des modifications ne sont pas enregistrées. Quitter ?')) onBack(); }}>
        <ArrowLeft size={16} /> Tous les contenus
      </button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h3">{isSettings ? 'Paramètres généraux' : meta?.label ?? section}</h1>
          {(meta?.hint || isSettings) && <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">{isSettings ? 'Coordonnées, WhatsApp, réseaux sociaux, horaires et créneaux de rendez-vous, informations légales. Communs aux deux langues.' : meta?.hint}</p>}
          {hasOverride && <p className="mt-2 text-xs text-[var(--c-orange)]">● Contenu personnalisé</p>}
        </div>
        {!isSettings && (
          <div className="lang-switch" role="tablist">
            {(['fr', 'en'] as const).map((l) => (
              <a key={l} role="tab" href="#" aria-current={locale === l ? 'true' : undefined} onClick={(e) => { e.preventDefault(); if (!dirty || confirm('Changer de langue sans enregistrer ?')) setLocale(l); }}>{l === 'fr' ? 'Français' : 'English'}</a>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-[1.6rem] border border-[var(--line)] p-5 md:p-8">
        {value === null ? <Spinner /> : <NodeEditor name={section} value={value} template={defaults} depth={0} onChange={setValue} />}
      </div>

      <div className="sticky bottom-4 z-10 mt-6 flex flex-wrap items-center gap-3 rounded-full border border-[var(--line)] bg-[#0e1328]/95 p-2 pl-5 shadow-2xl backdrop-blur">
        <span className={cn('mr-auto text-sm', dirty ? 'text-[var(--c-orange)]' : 'text-[var(--muted)]')}>{dirty ? 'Modifications non enregistrées' : 'À jour'}</span>
        {preview && <a href={preview} target="_blank" rel="noopener" className="text-sm font-semibold underline underline-offset-4">Voir la page ↗</a>}
        <AdminButton small onClick={openRevisions}>Historique</AdminButton>
        {hasOverride && <AdminButton small tone="danger" onClick={reset} disabled={busy}>Rétablir l’origine</AdminButton>}
        <AdminButton tone="primary" onClick={save} disabled={!dirty || busy}>{busy && <Spinner />} Enregistrer & publier</AdminButton>
      </div>

      {revisions && (
        <Modal title="Historique des versions" onClose={() => setRevisions(null)}>
          {!revisions.length ? <p className="text-[var(--muted)]">Aucune version enregistrée pour l’instant.</p> : (
            <ul className="divide-y divide-[var(--line)]">
              {revisions.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-semibold">{new Date(r.created_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    <p className="text-xs text-[var(--muted)]">{r.author_email ?? '—'}</p>
                  </div>
                  <AdminButton small onClick={() => { setValue(deepMerge(defaults, r.data)); setRevisions(null); toast('Version chargée — vérifiez puis enregistrez.'); }}>Restaurer</AdminButton>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ─── Sommaire des contenus ──────────────────────────────────────── */
export function ContentHome({ onOpen }: { onOpen: (section: string) => void }) {
  const [custom, setCustom] = useState<Record<string, string>>({});
  useEffect(() => {
    sb().from('content').select('section,locale,updated_at').then(({ data }) => {
      const m: Record<string, string> = {};
      for (const r of data ?? []) if (!m[r.section] || r.updated_at > m[r.section]) m[r.section] = r.updated_at;
      setCustom(m);
    });
  }, []);
  const stamp = (k: string) => custom[k] && <span className="mt-2 block text-xs text-[var(--c-orange)]">Modifié le {new Date(custom[k]).toLocaleDateString('fr-FR')}</span>;
  return (
    <div className="space-y-12">
      <div>
        <h1 className="h3">Contenus du site</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Choisissez une section à modifier. Chaque enregistrement est publié instantanément et conservé dans l’historique.</p>
      </div>
      <button onClick={() => onOpen('settings')} className="card card-hover block w-full p-6 text-left">
        <span className="tag">Commun FR/EN</span>
        <span className="mt-3 block font-display text-2xl">Paramètres généraux</span>
        <span className="mt-1 block text-sm text-[var(--muted)]">Téléphones, WhatsApp, e-mail, adresse, réseaux sociaux (X, Instagram, Facebook, TikTok…), horaires, créneaux de rendez-vous, mentions légales.</span>
        {stamp('settings')}
      </button>
      {SECTION_GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="kicker">{g.title}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {g.sections.map((s) => (
              <li key={s.key}>
                <button onClick={() => onOpen(s.key)} className="card card-hover h-full w-full p-5 text-left">
                  <span className="block font-bold">{s.label}</span>
                  {s.hint && <span className="mt-1 block text-xs text-[var(--muted)]">{s.hint}</span>}
                  {stamp(s.key)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
