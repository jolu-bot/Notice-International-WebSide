'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn, waLink } from '@/lib/utils';
import { DATA_LABEL, KIND_LABEL, STATUS_LABEL } from './labels';
import { errorMessage, sb, type Submission } from './supabase';
import { AdminButton, Spinner, useToast } from './ui';

const STATUS_TONE: Record<string, string> = { new: 'bg-[var(--c-orange)] text-black', in_progress: 'bg-[var(--c-blue)] text-white', done: 'bg-emerald-500 text-black', archived: 'bg-white/15' };

export function Inbox({ canDelete, onCount }: { canDelete: boolean; onCount?: (n: number) => void }) {
  const toast = useToast();
  const [rows, setRows] = useState<Submission[] | null>(null);
  const [kind, setKind] = useState('all');
  const [status, setStatus] = useState('open');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Submission | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await sb().from('submissions').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) toast(errorMessage(error), 'err');
    setRows((data as Submission[]) ?? []);
    onCount?.((data as Submission[] | null)?.filter((r) => r.status === 'new').length ?? 0);
  }, [toast, onCount]);
  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => (rows ?? []).filter((r) =>
    (kind === 'all' || r.kind === kind) &&
    (status === 'all' || (status === 'open' ? r.status === 'new' || r.status === 'in_progress' : r.status === status)) &&
    (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))), [rows, kind, status, q]);

  const update = async (r: Submission, patch: Partial<Submission>) => {
    const { error } = await sb().from('submissions').update(patch).eq('id', r.id);
    if (error) return toast(errorMessage(error), 'err');
    const next = { ...r, ...patch };
    setRows((rs) => rs?.map((x) => (x.id === r.id ? next : x)) ?? null);
    setSel(next);
    toast('Mis à jour.');
  };
  const remove = async (r: Submission) => {
    if (!confirm('Supprimer définitivement cette demande ?')) return;
    const { error } = await sb().from('submissions').delete().eq('id', r.id);
    if (error) return toast(errorMessage(error), 'err');
    setRows((rs) => rs?.filter((x) => x.id !== r.id) ?? null);
    setSel(null);
  };

  const exportCsv = () => {
    const keys = Array.from(new Set(list.flatMap((r) => Object.keys(r.data))));
    const head = ['date', 'type', 'statut', 'nom', 'email', 'telephone', 'langue', ...keys, 'notes'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = list.map((r) => [new Date(r.created_at).toISOString(), KIND_LABEL[r.kind], STATUS_LABEL[r.status], r.name, r.email, r.phone, r.locale, ...keys.map((k) => r.data[k]), r.notes].map(esc).join(';'));
    const blob = new Blob(['﻿' + [head.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `notice-demandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const counts = (k: string) => (rows ?? []).filter((r) => (k === 'all' || r.kind === k) && r.status === 'new').length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h3">Demandes reçues</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Messages, rendez-vous, devis, candidatures et inscriptions envoyés depuis le site.</p>
        </div>
        <div className="flex gap-2"><AdminButton small onClick={load}>Actualiser</AdminButton><AdminButton small onClick={exportCsv} disabled={!list.length}>Exporter (CSV)</AdminButton></div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {['all', 'contact', 'appointment', 'quote', 'career', 'newsletter'].map((k) => (
          <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{k === 'all' ? 'Tout' : KIND_LABEL[k]}{counts(k) > 0 && <span className="rounded-full bg-[var(--c-orange)] px-1.5 text-[10px] text-black">{counts(k)}</span>}</button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select className="field-input !w-auto !py-1.5 !text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">À traiter</option><option value="all">Tous les statuts</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className="field-input !w-64 !py-1.5 !text-sm" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <ul className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
          {rows === null ? <Spinner /> : !list.length ? <li className="text-[var(--muted)]">Aucune demande.</li> : list.map((r) => (
            <li key={r.id}>
              <button onClick={() => { setSel(r); if (r.status === 'new') update(r, { status: 'in_progress' }); }} className={cn('card w-full p-4 text-left transition-colors', sel?.id === r.id ? '!border-[var(--c-orange)]' : 'hover:!border-[var(--fg)]')}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[.14em] text-[var(--c-orange)]">{KIND_LABEL[r.kind]}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', STATUS_TONE[r.status])}>{STATUS_LABEL[r.status]}</span>
                </div>
                <p className="mt-1 truncate font-bold">{r.name || r.email}</p>
                <p className="truncate text-sm text-[var(--muted)]">{String(r.data.when ?? r.data.subject ?? r.data.services ?? r.data.profile ?? r.data.message ?? '')}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{new Date(r.created_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })} · {r.locale.toUpperCase()}</p>
              </button>
            </li>
          ))}
        </ul>

        <div className="card h-fit p-6 lg:sticky lg:top-24">
          {!sel ? <p className="text-[var(--muted)]">Sélectionnez une demande pour l’afficher.</p> : (
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--c-orange)]">{KIND_LABEL[sel.kind]}</p>
              <h2 className="mt-1 font-display text-3xl">{sel.name || sel.email}</h2>
              <p className="text-sm text-[var(--muted)]">{new Date(sel.created_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {sel.email && <a className="chip" href={`mailto:${sel.email}?subject=${encodeURIComponent('Notice International — votre demande')}`}>✉ {sel.email}</a>}
                {sel.phone && <a className="chip !border-[#25d366] !text-[#25d366]" href={waLink(sel.phone.replace(/\D/g, '').replace(/^(6\d{8})$/, '237$1'))} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
                {sel.phone && <a className="chip" href={`tel:${sel.phone.replace(/[^\d+]/g, '')}`}>☎ {sel.phone}</a>}
              </div>
              <dl className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {Object.entries(sel.data).filter(([k, v]) => v !== '' && v !== null && k !== 'date' && k !== 'time').map(([k, v]) => (
                  <div key={k} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
                    <dt className="text-sm text-[var(--muted)]">{DATA_LABEL[k] ?? k}</dt>
                    <dd className="whitespace-pre-wrap break-words">{k === 'link' ? <a className="underline" href={String(v)} target="_blank" rel="noopener noreferrer">{String(v)}</a> : String(v)}</dd>
                  </div>
                ))}
              </dl>
              <label className="field mt-6 block">
                <span className="field-label">Notes internes</span>
                <textarea className="field-input !text-base" rows={3} defaultValue={sel.notes ?? ''} key={sel.id} onBlur={(e) => { if (e.target.value !== (sel.notes ?? '')) update(sel, { notes: e.target.value }); }} />
                <span className="field-line" />
              </label>
              <div className="mt-6 flex flex-wrap gap-2">
                {(['in_progress', 'done', 'archived'] as const).map((s) => (
                  <AdminButton key={s} small tone={sel.status === s ? 'primary' : 'ghost'} onClick={() => update(sel, { status: s })}>{STATUS_LABEL[s]}</AdminButton>
                ))}
                {canDelete && <AdminButton small tone="danger" onClick={() => remove(sel)}>Supprimer</AdminButton>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
