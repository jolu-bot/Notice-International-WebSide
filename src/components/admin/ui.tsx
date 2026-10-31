'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { imgUrl } from '../ui/Picture';
import { Close } from '../ui/Icons';
import { mediaUrl, sb, errorMessage } from './supabase';

/* ─── Notifications ──────────────────────────────────────────────── */
type Toast = { id: number; text: string; tone: 'ok' | 'err' };
const ToastCtx = createContext<(text: string, tone?: 'ok' | 'err') => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cn('rounded-2xl px-5 py-3 text-sm font-semibold shadow-2xl', t.tone === 'ok' ? 'bg-[var(--c-cream)] text-[var(--c-ink)]' : 'bg-[#ff6b6b] text-white')}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)} />;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-black/70 p-4 backdrop-blur" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={cn('card max-h-[90vh] w-full overflow-y-auto !bg-[#0e1328] p-6', wide ? 'max-w-5xl' : 'max-w-lg')}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl">{title}</h2>
          <button className="lb-btn !h-10 !w-10" onClick={onClose} aria-label="Fermer"><Close size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminButton({ children, onClick, tone = 'ghost', disabled, type = 'button', small, title }: { children: ReactNode; onClick?: () => void; tone?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; type?: 'button' | 'submit'; small?: boolean; title?: string }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title}
      className={cn('inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40',
        small ? 'h-9 px-4 text-xs' : 'h-11 px-5 text-sm',
        tone === 'primary' && 'bg-[var(--c-orange)] text-[var(--c-ink)] hover:brightness-110',
        tone === 'ghost' && 'border border-[var(--line)] hover:border-[var(--fg)]',
        tone === 'danger' && 'border border-[#ff6b6b]/50 text-[#ff9b9b] hover:bg-[#ff6b6b] hover:text-white')}>
      {children}
    </button>
  );
}

/* ─── Envoi d'images (redimensionnées en WebP côté navigateur) ───── */
export async function uploadFile(file: File): Promise<string> {
  let blob: Blob = file;
  let ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  if (/^image\/(jpeg|png|webp)$/.test(file.type)) {
    const bmp = await createImageBitmap(file);
    const max = 2400;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? file), 'image/webp', 0.84));
    ext = 'webp';
  }
  const now = new Date();
  const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'media';
  const path = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Date.now().toString(36)}-${base}.${ext}`;
  const { error } = await sb().storage.from('media').upload(path, blob, { contentType: ext === 'webp' ? 'image/webp' : file.type, cacheControl: '31536000', upsert: false });
  if (error) throw error;
  return mediaUrl(path);
}

export type MediaItem = { path: string; url: string; size: number; created: string };

export async function listMedia(): Promise<MediaItem[]> {
  const out: MediaItem[] = [];
  const walk = async (prefix: string) => {
    const { data, error } = await sb().storage.from('media').list(prefix, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) throw error;
    for (const f of data ?? []) {
      const p = prefix ? `${prefix}/${f.name}` : f.name;
      if (!f.id) await walk(p);
      else out.push({ path: p, url: mediaUrl(p), size: (f.metadata as { size?: number } | null)?.size ?? 0, created: f.created_at ?? '' });
    }
  };
  await walk('');
  return out.sort((a, b) => b.created.localeCompare(a.created));
}

/** Champ image : aperçu, envoi depuis l'ordinateur ou choix dans la médiathèque. */
export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try { onChange(await uploadFile(f)); toast('Image envoyée.'); } catch (e) { toast(errorMessage(e), 'err'); } finally { setBusy(false); }
  };
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="mt-2 flex items-start gap-4">
        <div className="relative h-24 w-32 flex-none overflow-hidden rounded-xl border border-[var(--line)] bg-black/30">
          {value ? <img src={imgUrl(value, 800)} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-xs text-[var(--muted)]">Aucune</span>}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input className="field-input !py-1.5 !text-sm" value={value} onChange={(e) => onChange(e.target.value)} placeholder="/images/… ou https://…" />
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-bold hover:border-[var(--fg)]">
              {busy ? <Spinner /> : '⬆'} Envoyer une image
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <AdminButton small onClick={() => setPicker(true)}>Médiathèque</AdminButton>
          </div>
        </div>
      </div>
      {picker && <MediaPicker onClose={() => setPicker(false)} onPick={(url) => { onChange(url); setPicker(false); }} />}
    </div>
  );
}

export function MediaPicker({ onClose, onPick }: { onClose: () => void; onPick: (url: string) => void }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const toast = useToast();
  useEffect(() => { listMedia().then(setItems).catch((e) => { toast(errorMessage(e), 'err'); setItems([]); }); }, [toast]);
  return (
    <Modal title="Médiathèque" onClose={onClose} wide>
      {!items ? <Spinner /> : !items.length ? <p className="text-[var(--muted)]">La médiathèque est vide. Envoyez une première image.</p> : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.filter((i) => /\.(webp|jpe?g|png|gif|avif|svg)$/i.test(i.path)).map((i) => (
            <li key={i.path}><button onClick={() => onPick(i.url)} className="block aspect-square w-full overflow-hidden rounded-xl border border-[var(--line)] hover:border-[var(--c-orange)]"><img src={i.url} alt="" className="h-full w-full object-cover" loading="lazy" /></button></li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
