'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ROLE_LABEL } from './labels';
import { errorMessage, generatePassword, sb, type Profile, type Role } from './supabase';
import { AdminButton, Modal, Spinner, useToast } from './ui';

const ROLE_HELP: Record<Role, string> = {
  owner: 'Tous les droits, y compris la gestion des administrateurs. Ne peut pas être désactivé.',
  admin: 'Gère les contenus, les demandes et les accès des éditeurs.',
  editor: 'Modifie les contenus, la médiathèque et traite les demandes.',
};

export function Users({ me }: { me: Profile }) {
  const toast = useToast();
  const [rows, setRows] = useState<Profile[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await sb().from('profiles').select('*').order('created_at');
    if (error) toast(errorMessage(error), 'err');
    setRows((data as Profile[]) ?? []);
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const rpc = async (fn: string, args: Record<string, unknown>, ok: string) => {
    const { error } = await sb().rpc(fn, args);
    if (error) { toast(errorMessage(error), 'err'); return false; }
    toast(ok); load(); return true;
  };

  const resetPassword = async (p: Profile) => {
    if (!confirm(`Générer un nouveau mot de passe temporaire pour ${p.email} ?`)) return;
    const password = generatePassword();
    if (await rpc('admin_set_password', { p_user: p.id, p_password: password }, 'Mot de passe réinitialisé.')) setSecret({ email: p.email, password });
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h3">Équipe & accès</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Donnez accès à l’espace d’administration aux personnes de votre choix. Chaque personne reçoit un mot de passe temporaire, qu’elle devra changer à sa première connexion.</p>
        </div>
        <AdminButton tone="primary" onClick={() => setCreating(true)}>+ Ajouter une personne</AdminButton>
      </div>
      <ul className="mt-8 space-y-3">
        {rows === null ? <Spinner /> : rows.map((p) => (
          <li key={p.id} className={`card flex flex-col gap-4 p-5 md:flex-row md:items-center ${p.active ? '' : 'opacity-50'}`}>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{p.full_name || p.email} {p.id === me.id && <span className="text-xs text-[var(--c-orange)]">(vous)</span>}</p>
              <p className="truncate text-sm text-[var(--muted)]">{p.email}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {p.active ? (p.last_seen_at ? `Dernière activité : ${new Date(p.last_seen_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Jamais connecté') : 'Compte désactivé'}
                {p.must_change_password && p.active && ' · mot de passe temporaire'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select className="field-input !w-auto !py-1.5 !text-sm" value={p.role} disabled={p.id === me.id || p.role === 'owner' || (me.role !== 'owner' && p.role === 'admin')}
                onChange={(e) => rpc('admin_set_role', { p_user: p.id, p_role: e.target.value }, 'Rôle modifié.')}>
                {(['owner', 'admin', 'editor'] as Role[]).filter((r) => r !== 'owner' || me.role === 'owner' || p.role === 'owner').map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              {p.id !== me.id && (p.role !== 'owner' || me.role === 'owner') && <AdminButton small onClick={() => resetPassword(p)}>Nouveau mot de passe</AdminButton>}
              {p.id !== me.id && p.role !== 'owner' && (
                <AdminButton small tone={p.active ? 'danger' : 'ghost'} onClick={() => rpc('admin_set_active', { p_user: p.id, p_active: !p.active }, p.active ? 'Accès désactivé.' : 'Accès réactivé.')}>
                  {p.active ? 'Désactiver' : 'Réactiver'}
                </AdminButton>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {(Object.keys(ROLE_HELP) as Role[]).map((r) => (
          <div key={r} className="rounded-2xl border border-[var(--line)] p-4"><p className="font-bold">{ROLE_LABEL[r]}</p><p className="mt-1 text-sm text-[var(--muted)]">{ROLE_HELP[r]}</p></div>
        ))}
      </div>

      {creating && <CreateUser isOwner={me.role === 'owner'} onClose={() => setCreating(false)} onDone={(email, password) => { setCreating(false); setSecret({ email, password }); load(); }} />}
      {secret && (
        <Modal title="Identifiants à transmettre" onClose={() => setSecret(null)}>
          <p className="text-sm text-[var(--muted)]">Communiquez ces informations à la personne concernée (de vive voix, par WhatsApp ou SMS). Le mot de passe ne sera plus affiché ensuite ; elle devra le changer à sa première connexion.</p>
          <div className="mt-5 space-y-3 rounded-2xl bg-black/30 p-5 font-mono text-sm">
            <p>Adresse : {typeof window !== 'undefined' ? `${window.location.origin}/admin` : '/admin'}</p>
            <p>E-mail : {secret.email}</p>
            <p>Mot de passe : <strong className="text-[var(--c-orange)]">{secret.password}</strong></p>
          </div>
          <div className="mt-5 flex gap-2">
            <AdminButton tone="primary" onClick={() => { navigator.clipboard.writeText(`Espace d’administration Notice International\n${window.location.origin}/admin\nE-mail : ${secret.email}\nMot de passe temporaire : ${secret.password}`); toast('Copié.'); }}>Copier</AdminButton>
            <AdminButton onClick={() => setSecret(null)}>Fermer</AdminButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CreateUser({ isOwner, onClose, onDone }: { isOwner: boolean; onClose: () => void; onDone: (email: string, password: string) => void }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const password = generatePassword();
    const { error } = await sb().rpc('admin_create_user', { p_email: email, p_password: password, p_full_name: name, p_role: role });
    setBusy(false);
    if (error) return toast(errorMessage(error), 'err');
    onDone(email.trim().toLowerCase(), password);
  };
  return (
    <Modal title="Ajouter une personne" onClose={onClose}>
      <form onSubmit={submit} className="grid gap-6">
        <label className="field block"><span className="field-label">Nom complet</span><input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required /><span className="field-line" /></label>
        <label className="field block"><span className="field-label">E-mail</span><input type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} required /><span className="field-line" /></label>
        <label className="field block"><span className="field-label">Rôle</span>
          <select className="field-input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="editor">{ROLE_LABEL.editor} — contenus & demandes</option>
            <option value="admin">{ROLE_LABEL.admin} — + gestion des accès</option>
            {isOwner && <option value="owner">{ROLE_LABEL.owner}</option>}
          </select><span className="field-line" /></label>
        <AdminButton type="submit" tone="primary" disabled={busy}>{busy && <Spinner />} Créer l’accès</AdminButton>
      </form>
    </Modal>
  );
}
