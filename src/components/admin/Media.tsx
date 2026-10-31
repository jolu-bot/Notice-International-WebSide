'use client';

import { useCallback, useEffect, useState } from 'react';
import { errorMessage, sb } from './supabase';
import { AdminButton, listMedia, Spinner, uploadFile, useToast, type MediaItem } from './ui';

export function Media() {
  const toast = useToast();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const load = useCallback(() => { listMedia().then(setItems).catch((e) => { toast(errorMessage(e), 'err'); setItems([]); }); }, [toast]);
  useEffect(() => { load(); }, [load]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    let n = 0;
    for (const f of Array.from(files)) {
      try { await uploadFile(f); n++; } catch (e) { toast(`${f.name} : ${errorMessage(e)}`, 'err'); }
    }
    setBusy(false);
    if (n) toast(`${n} fichier(s) envoyé(s).`);
    load();
  };
  const remove = async (it: MediaItem) => {
    if (!confirm('Supprimer ce fichier ? Vérifiez qu’il n’est plus utilisé sur le site.')) return;
    const { error } = await sb().storage.from('media').remove([it.path]);
    if (error) return toast(errorMessage(error), 'err');
    setItems((xs) => xs?.filter((x) => x.path !== it.path) ?? null);
  };

  return (
    <div>
      <h1 className="h3">Médiathèque</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Les images envoyées sont automatiquement optimisées (WebP, 2400 px max). Copiez l’adresse d’un fichier ou utilisez le bouton « Médiathèque » dans l’éditeur.</p>
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
        className={`mt-6 grid cursor-pointer place-items-center rounded-[1.6rem] border-2 border-dashed p-10 text-center transition-colors ${drag ? 'border-[var(--c-orange)] bg-[var(--c-orange)]/10' : 'border-[var(--line)] hover:border-[var(--fg)]'}`}>
        {busy ? <Spinner className="h-8 w-8" /> : (<><span className="font-display text-2xl">Déposez vos fichiers ici</span><span className="mt-1 text-sm text-[var(--muted)]">ou cliquez pour parcourir — images, PDF, vidéos MP4 (15 Mo max)</span></>)}
        <input type="file" multiple accept="image/*,video/mp4,application/pdf" className="sr-only" onChange={(e) => onFiles(e.target.files)} />
      </label>
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items === null ? <Spinner /> : items.map((it) => (
          <li key={it.path} className="card overflow-hidden">
            <div className="aspect-square bg-black/30">
              {/\.(webp|jpe?g|png|gif|avif|svg)$/i.test(it.path) ? <img src={it.url} alt="" className="h-full w-full object-cover" loading="lazy" /> : <span className="grid h-full place-items-center text-sm text-[var(--muted)]">{it.path.split('.').pop()?.toUpperCase()}</span>}
            </div>
            <div className="space-y-2 p-3">
              <p className="truncate text-xs text-[var(--muted)]" title={it.path}>{it.path.split('/').pop()}</p>
              <div className="flex gap-1">
                <AdminButton small onClick={() => { navigator.clipboard.writeText(it.url); toast('Adresse copiée.'); }}>Copier</AdminButton>
                <AdminButton small tone="danger" onClick={() => remove(it)}>✕</AdminButton>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
