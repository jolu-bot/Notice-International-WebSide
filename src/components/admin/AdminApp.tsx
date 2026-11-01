'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { hasSupabase } from '@/lib/site';
import { cn } from '@/lib/utils';
import { Logo } from '../brand/Logo';
import { ContentHome, SectionEditor } from './ContentEditor';
import { Inbox } from './Inbox';
import { Media } from './Media';
import { Users } from './Users';
import { KIND_LABEL, ROLE_LABEL } from './labels';
import { errorMessage, sb, type Profile, type Submission } from './supabase';
import { AdminButton, Spinner, ToastProvider, useToast } from './ui';

type View = 'dashboard' | 'content' | 'inbox' | 'media' | 'users' | 'account';

export function AdminApp() {
  return <ToastProvider><Gate /></ToastProvider>;
}

function Gate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    if (!hasSupabase) { setSession(null); return; }
    sb().auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb().auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await sb().from('profiles').select('*').eq('id', uid).maybeSingle();
    setProfile((data as Profile) ?? null);
    sb().rpc('touch_last_seen').then(() => {});
  }, []);

  useEffect(() => {
    if (session) loadProfile(session.user.id);
    else if (session === null) setProfile(undefined);
  }, [session, loadProfile]);

  if (!hasSupabase) return <Centered><p className="h3">Configuration requise</p><p className="mt-3 text-[var(--muted)]">Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.</p></Centered>;
  if (session === undefined || (session && profile === undefined)) return <Centered><Spinner className="h-8 w-8" /></Centered>;
  if (!session) return <Login />;
  if (!profile || !profile.active) return (
    <Centered>
      <p className="h3">Accès non autorisé</p>
      <p className="mt-3 text-[var(--muted)]">Ce compte n’a pas (ou plus) accès à l’espace d’administration. Contactez un administrateur.</p>
      <div className="mt-6"><AdminButton onClick={() => sb().auth.signOut()}>Se déconnecter</AdminButton></div>
    </Centered>
  );
  if (profile.must_change_password) return <ChangePassword first onDone={() => loadProfile(profile.id)} />;
  return <Shell me={profile} reload={() => loadProfile(profile.id)} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="w-full max-w-md text-center">{children}</div>
    </main>
  );
}

function BackToSite({ className }: { className?: string }) {
  return (
    <a href="/" className={cn('group inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold transition-colors hover:border-[var(--fg)]', className)}>
      <span aria-hidden className="transition-transform group-hover:-translate-x-1">←</span> Retour au site
    </a>
  );
}

function PasswordInput({ value, onChange, autoComplete, label }: { value: string; onChange: (v: string) => void; autoComplete: string; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field block">
      <span className="field-label">{label}</span>
      <input type={show ? 'text' : 'password'} className="field-input !pr-24" value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} required />
      <button type="button" onClick={() => setShow((v) => !v)} aria-pressed={show} className="absolute bottom-3 right-0 rounded-full px-3 py-1 text-xs font-bold text-[var(--muted)] hover:text-[var(--fg)]">
        {show ? 'Masquer' : 'Afficher'}
      </button>
      <span className="field-line" />
    </label>
  );
}

function Login() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [lockedUntil]);
  const wait = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (wait > 0) return;
    setBusy(true);
    const { error } = await sb().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (error) {
      const n = fails + 1;
      setFails(n);
      // Après 3 échecs, une pause croissante décourage les essais en série
      if (n >= 3) { setLockedUntil(Date.now() + Math.min(300, 15 * 2 ** (n - 3)) * 1000); setNow(Date.now()); }
      toast(errorMessage(error), 'err');
    }
  };
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0e1328] lg:grid lg:place-items-center">
        <div className="w-[60%] max-w-md"><Logo variant="full" sloganColor="var(--c-cream)" /></div>
        <div className="mosaic-band animated absolute inset-x-0 bottom-0" />
      </div>
      <div className="relative grid place-items-center p-6 pt-24">
        <BackToSite className="absolute left-6 top-6" />
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-10 w-20 lg:hidden"><Logo /></div>
          <p className="kicker">Espace d’administration</p>
          <h1 className="h2 mt-4">Bonjour.</h1>
          <p className="mt-2 text-[var(--muted)]">Connectez-vous pour gérer le site Notice International.</p>
          <div className="mt-10 grid gap-7">
            <label className="field block"><span className="field-label">E-mail</span><input type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus /><span className="field-line" /></label>
            <PasswordInput label="Mot de passe" value={password} onChange={setPassword} autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary mt-10 w-full" disabled={busy || wait > 0}>
            <span>{busy ? 'Connexion…' : wait > 0 ? `Patientez ${wait} s` : 'Se connecter'}</span>
          </button>
          <p className="mt-6 text-xs text-[var(--muted)]">Mot de passe oublié ? Un administrateur peut vous en générer un nouveau depuis « Équipe & accès ».</p>
          <p className="mt-3 text-xs text-[var(--muted)]">Connexion chiffrée · déconnexion automatique après 45 minutes d’inactivité.</p>
        </form>
      </div>
    </main>
  );
}

function ChangePassword({ first, onDone }: { first?: boolean; onDone: () => void }) {
  const toast = useToast();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (a.length < 10) return toast('10 caractères minimum.', 'err');
    if (!/[a-zA-Z]/.test(a) || !/\d/.test(a)) return toast('Mélangez lettres et chiffres.', 'err');
    if (a !== b) return toast('Les deux mots de passe diffèrent.', 'err');
    setBusy(true);
    const { error } = await sb().auth.updateUser({ password: a });
    if (!error) await sb().rpc('mark_password_changed');
    setBusy(false);
    if (error) return toast(errorMessage(error), 'err');
    toast('Mot de passe mis à jour.');
    setA(''); setB('');
    onDone();
  };
  const form = (
    <form onSubmit={submit} className="grid w-full max-w-sm gap-7 text-left">
      <PasswordInput label="Nouveau mot de passe (10 caractères, lettres et chiffres)" value={a} onChange={setA} autoComplete="new-password" />
      <PasswordInput label="Confirmation" value={b} onChange={setB} autoComplete="new-password" />
      <AdminButton type="submit" tone="primary" disabled={busy}>{busy && <Spinner />} Enregistrer</AdminButton>
    </form>
  );
  if (!first) return form;
  return (
    <Centered>
      <div className="mx-auto mb-8 w-20"><Logo /></div>
      <p className="h3">Bienvenue !</p>
      <p className="mb-8 mt-3 text-[var(--muted)]">Pour sécuriser votre accès, choisissez votre mot de passe personnel.</p>
      <div className="flex justify-center">{form}</div>
    </Centered>
  );
}

const NAV: Array<{ id: View; label: string; admin?: boolean }> = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'inbox', label: 'Demandes' },
  { id: 'content', label: 'Contenus' },
  { id: 'media', label: 'Médiathèque' },
  { id: 'users', label: 'Équipe & accès', admin: true },
  { id: 'account', label: 'Mon compte' },
];

function readHash(): { view: View; section?: string } {
  const [v, s] = window.location.hash.replace(/^#\/?/, '').split('/');
  return { view: (NAV.some((n) => n.id === v) ? v : 'dashboard') as View, section: s || undefined };
}

const IDLE_MS = 45 * 60_000;

/** Ferme la session après 45 minutes sans activité (poste partagé, ordinateur oublié ouvert…). */
function useIdleLogout() {
  const toast = useToast();
  useEffect(() => {
    let last = Date.now();
    const bump = () => { last = Date.now(); };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = window.setInterval(() => {
      if (Date.now() - last > IDLE_MS) { toast('Session fermée après 45 minutes d’inactivité.'); sb().auth.signOut(); }
    }, 30_000);
    return () => { events.forEach((e) => window.removeEventListener(e, bump)); window.clearInterval(t); };
  }, [toast]);
}

function Shell({ me, reload }: { me: Profile; reload: () => void }) {
  useIdleLogout();
  const [route, setRoute] = useState<{ view: View; section?: string }>({ view: 'dashboard' });
  const [newCount, setNewCount] = useState(0);
  const isAdmin = me.role === 'owner' || me.role === 'admin';

  useEffect(() => {
    const sync = () => setRoute(readHash());
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    sb().from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'new').then(({ count }) => setNewCount(count ?? 0));
  }, [route.view]);

  const go = (view: View, section?: string) => { window.location.hash = `/${view}${section ? `/${section}` : ''}`; };

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-[var(--line)] bg-[#0b1022] p-5 lg:sticky lg:top-0 lg:h-svh lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3">
          <span className="w-11 flex-none"><Logo /></span>
          <span className="min-w-0 flex-1 leading-tight"><span className="block font-extrabold">Notice International</span><span className="text-xs text-[var(--muted)]">Administration</span></span>
          <span className="flex flex-none gap-2 lg:hidden">
            <a href="/" className="chip !px-3 !py-1.5 !text-xs" aria-label="Retour au site">← Site</a>
            <button className="chip !px-3 !py-1.5 !text-xs" onClick={() => sb().auth.signOut()}>Déconnexion</button>
          </span>
        </div>
        <nav className="mt-8 flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.filter((n) => !n.admin || isAdmin).map((n) => (
            <button key={n.id} onClick={() => go(n.id)} className={cn('flex flex-none items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors', route.view === n.id ? 'bg-[var(--c-cream)] text-[var(--c-ink)]' : 'hover:bg-white/5')}>
              {n.label}
              {n.id === 'inbox' && newCount > 0 && <span className="rounded-full bg-[var(--c-orange)] px-2 text-xs text-black">{newCount}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-8 hidden space-y-3 border-t border-[var(--line)] pt-6 text-sm lg:block">
          <p className="truncate font-semibold">{me.full_name || me.email}</p>
          <p className="text-xs text-[var(--muted)]">{ROLE_LABEL[me.role]}</p>
          <BackToSite className="w-full justify-center" />
          <div className="flex flex-wrap gap-2">
            <a href="/fr" target="_blank" rel="noopener" className="chip !py-1.5 !text-xs">Ouvrir dans un onglet ↗</a>
            <button className="chip !py-1.5 !text-xs" onClick={() => sb().auth.signOut()}>Déconnexion</button>
          </div>
          <a href="https://www.joyeds.com" target="_blank" rel="noopener" className="block pt-4 text-xs font-semibold text-[#3b8bff]">Powered by JoYed’S</a>
        </div>
      </aside>
      <main className="min-w-0 p-5 md:p-10">
        {route.view === 'dashboard' && <Dashboard me={me} go={go} />}
        {route.view === 'inbox' && <Inbox canDelete={isAdmin} onCount={setNewCount} />}
        {route.view === 'content' && (route.section ? <SectionEditor section={route.section} initialLocale="fr" onBack={() => go('content')} /> : <ContentHome onOpen={(s) => go('content', s)} />)}
        {route.view === 'media' && <Media />}
        {route.view === 'users' && isAdmin && <Users me={me} />}
        {route.view === 'account' && <Account me={me} reload={reload} />}
      </main>
    </div>
  );
}

function Dashboard({ me, go }: { me: Profile; go: (v: View, s?: string) => void }) {
  const toast = useToast();
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [edits, setEdits] = useState<Array<{ section: string; locale: string; author_email: string | null; created_at: string }>>([]);
  useEffect(() => {
    sb().from('submissions').select('*').order('created_at', { ascending: false }).limit(200).then(({ data, error }) => { if (error) toast(errorMessage(error), 'err'); setSubs((data as Submission[]) ?? []); });
    sb().from('content_revisions').select('section,locale,author_email,created_at').order('created_at', { ascending: false }).limit(6).then(({ data }) => setEdits(data ?? []));
  }, [toast]);
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const firstName = (me.full_name || '').split(' ')[0];
  const fresh = (subs ?? []).filter((s) => s.status === 'new');
  const kinds = ['contact', 'appointment', 'quote', 'career', 'newsletter'] as const;
  const upcoming = (subs ?? []).filter((s) => s.kind === 'appointment' && typeof s.data.date === 'string' && (s.data.date as string) >= new Date().toISOString().slice(0, 10) && s.status !== 'archived')
    .sort((a, b) => String(a.data.date).localeCompare(String(b.data.date)) || String(a.data.time).localeCompare(String(b.data.time))).slice(0, 5);

  return (
    <div className="space-y-10">
      <div>
        <p className="kicker">Tableau de bord</p>
        <h1 className="h2 mt-3">{hello}{firstName ? `, ${firstName}` : ''}.</h1>
        <p className="mt-2 text-[var(--muted)]">{fresh.length ? `${fresh.length} nouvelle(s) demande(s) vous attend(ent).` : 'Aucune nouvelle demande. Tout est sous contrôle.'}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kinds.map((k) => {
          const total = (subs ?? []).filter((s) => s.kind === k).length;
          const n = fresh.filter((s) => s.kind === k).length;
          return (
            <button key={k} onClick={() => go('inbox')} className="card card-hover p-5 text-left">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--muted)]">{KIND_LABEL[k]}</p>
              <p className="stat-num !text-5xl mt-3">{subs ? total : '…'}</p>
              {n > 0 && <p className="mt-2 text-xs font-bold text-[var(--c-orange)]">{n} nouveau(x)</p>}
            </button>
          );
        })}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-display text-2xl">Prochains rendez-vous</h2>
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {!upcoming.length ? <li className="py-3 text-sm text-[var(--muted)]">Aucun rendez-vous à venir.</li> : upcoming.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0"><p className="truncate font-semibold">{s.name}</p><p className="truncate text-sm text-[var(--muted)]">{String(s.data.subject ?? '')} · {String(s.data.mode ?? '')}</p></div>
                <p className="num whitespace-nowrap text-right text-sm">{new Date(String(s.data.date)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}<br /><span className="text-[var(--c-orange)]">{String(s.data.time ?? '')}</span></p>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-6">
          <h2 className="font-display text-2xl">Dernières modifications</h2>
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {!edits.length ? <li className="py-3 text-sm text-[var(--muted)]">Aucune modification pour l’instant — les textes d’origine sont en ligne.</li> : edits.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-3">
                <button onClick={() => go('content', e.section)} className="truncate text-left font-semibold hover:underline">{e.section} <span className="text-xs text-[var(--muted)]">({e.locale})</span></button>
                <p className="whitespace-nowrap text-xs text-[var(--muted)]">{new Date(e.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · {e.author_email?.split('@')[0]}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="flex flex-wrap gap-3">
        <AdminButton tone="primary" onClick={() => go('content')}>Modifier les contenus</AdminButton>
        <AdminButton onClick={() => go('content', 'work')}>Ajouter une réalisation</AdminButton>
        <AdminButton onClick={() => go('content', 'settings')}>Coordonnées & réseaux sociaux</AdminButton>
      </div>
    </div>
  );
}

function Account({ me, reload }: { me: Profile; reload: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(me.full_name ?? '');
  const saveName = async () => {
    const { error } = await sb().from('profiles').update({ full_name: name }).eq('id', me.id);
    if (error) return toast(errorMessage(error), 'err');
    toast('Profil mis à jour.'); reload();
  };
  return (
    <div className="max-w-xl space-y-12">
      <div>
        <h1 className="h3">Mon compte</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{me.email} · {ROLE_LABEL[me.role]}</p>
      </div>
      <section className="grid gap-5">
        <label className="field block"><span className="field-label">Nom affiché</span><input className="field-input" value={name} onChange={(e) => setName(e.target.value)} /><span className="field-line" /></label>
        <div><AdminButton onClick={saveName}>Enregistrer</AdminButton></div>
      </section>
      <section>
        <h2 className="font-display text-2xl">Changer mon mot de passe</h2>
        <div className="mt-6"><ChangePassword onDone={reload} /></div>
      </section>
    </div>
  );
}
