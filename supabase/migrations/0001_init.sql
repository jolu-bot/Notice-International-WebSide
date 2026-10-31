-- ════════════════════════════════════════════════════════════════════
--  NOTICE INTERNATIONAL — schéma CMS (contenus, révisions, messages, rôles)
--  Conçu par JoYed'S — https://www.joyeds.com
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

-- ─── Rôles ───────────────────────────────────────────────────────────
do $$ begin
  create type public.app_role as enum ('owner', 'admin', 'editor');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null default 'editor',
  must_change_password boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- ─── Contenus éditables (surcharge des contenus par défaut du code) ──
create table if not exists public.content (
  section text not null check (char_length(section) between 1 and 64),
  locale text not null check (locale in ('fr', 'en', 'all')),
  data jsonb not null check (pg_column_size(data) < 900000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (section, locale)
);

create table if not exists public.content_revisions (
  id bigint generated always as identity primary key,
  section text not null,
  locale text not null,
  data jsonb not null,
  author uuid references auth.users (id) on delete set null,
  author_email text,
  created_at timestamptz not null default now()
);
create index if not exists content_revisions_lookup on public.content_revisions (section, locale, created_at desc);

-- ─── Messages reçus depuis le site ───────────────────────────────────
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'appointment', 'quote', 'career', 'newsletter')),
  locale text not null default 'fr' check (locale in ('fr', 'en')),
  name text check (char_length(name) <= 160),
  email text check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 40),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 20000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'done', 'archived')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists submissions_created on public.submissions (created_at desc);
create index if not exists submissions_status on public.submissions (status);

-- ─── Fonctions d'autorisation ────────────────────────────────────────
create or replace function public.my_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and active)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and active and role in ('owner', 'admin'))
$$;

-- ─── Historique automatique des contenus ─────────────────────────────
create or replace function public.content_snapshot() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  insert into public.content_revisions (section, locale, data, author, author_email)
  values (new.section, new.locale, new.data, (select auth.uid()),
          (select email from public.profiles where id = (select auth.uid())));
  return new;
end $$;

drop trigger if exists content_snapshot on public.content;
create trigger content_snapshot before insert or update on public.content
for each row execute function public.content_snapshot();

-- ─── Gestion des comptes (sans e-mail : créés par un administrateur) ─
create or replace function public.admin_create_user(p_email text, p_password text, p_full_name text, p_role public.app_role)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_role = 'owner' and public.my_role() <> 'owner' then raise exception 'forbidden'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email'; end if;
  if char_length(p_password) < 10 then raise exception 'weak_password'; end if;
  if exists (select 1 from auth.users where email = v_email) then raise exception 'email_exists'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', p_full_name),
    now(), now(), '', '', '', '', '', '', '', '');

  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now());

  insert into public.profiles (id, email, full_name, role, must_change_password)
  values (v_id, v_email, p_full_name, p_role, true);
  return v_id;
end $$;

create or replace function public.admin_set_password(p_user uuid, p_password text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if (select role from public.profiles where id = p_user) = 'owner' and public.my_role() <> 'owner'
    then raise exception 'forbidden'; end if;
  if char_length(p_password) < 10 then raise exception 'weak_password'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
  where id = p_user;
  update public.profiles set must_change_password = (p_user <> (select auth.uid())) where id = p_user;
end $$;

create or replace function public.admin_set_role(p_user uuid, p_role public.app_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_user = (select auth.uid()) then raise exception 'cannot_change_self'; end if;
  if ((select role from public.profiles where id = p_user) = 'owner' or p_role = 'owner')
     and public.my_role() <> 'owner' then raise exception 'forbidden'; end if;
  update public.profiles set role = p_role where id = p_user;
end $$;

-- Les comptes ne sont jamais supprimés : ils sont désactivés (accès coupé, historique conservé)
create or replace function public.admin_set_active(p_user uuid, p_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_user = (select auth.uid()) then raise exception 'cannot_change_self'; end if;
  if (select role from public.profiles where id = p_user) = 'owner' then raise exception 'forbidden'; end if;
  update public.profiles set active = p_active where id = p_user;
  update auth.users set banned_until = case when p_active then null else 'infinity'::timestamptz end, updated_at = now()
  where id = p_user;
end $$;

-- L'utilisateur confirme avoir changé son mot de passe (après supabase.auth.updateUser)
create or replace function public.mark_password_changed() returns void
language sql security definer set search_path = '' as $$
  update public.profiles set must_change_password = false, last_seen_at = now() where id = (select auth.uid())
$$;

create or replace function public.touch_last_seen() returns void
language sql security definer set search_path = '' as $$
  update public.profiles set last_seen_at = now() where id = (select auth.uid())
$$;

revoke execute on function public.admin_create_user, public.admin_set_password, public.admin_set_role,
  public.admin_set_active, public.mark_password_changed, public.touch_last_seen from public, anon;
grant execute on function public.admin_create_user, public.admin_set_password, public.admin_set_role,
  public.admin_set_active, public.mark_password_changed, public.touch_last_seen to authenticated;

-- Fonctions d'aide : jamais exposées aux visiteurs anonymes
revoke execute on function public.content_snapshot() from public, anon, authenticated;
revoke execute on function public.is_admin(), public.is_editor(), public.my_role() from public, anon;
grant execute on function public.is_admin(), public.is_editor(), public.my_role() to authenticated;

-- ─── Row Level Security ──────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.content enable row level security;
alter table public.content_revisions enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = (select public.my_role()));

drop policy if exists "content public read" on public.content;
create policy "content public read" on public.content for select to anon, authenticated using (true);
drop policy if exists "content editors insert" on public.content;
create policy "content editors insert" on public.content for insert to authenticated with check ((select public.is_editor()));
drop policy if exists "content editors update" on public.content;
create policy "content editors update" on public.content for update to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));
drop policy if exists "content editors delete" on public.content;
create policy "content editors delete" on public.content for delete to authenticated using ((select public.is_editor()));

drop policy if exists "revisions editors read" on public.content_revisions;
create policy "revisions editors read" on public.content_revisions for select to authenticated using ((select public.is_editor()));

drop policy if exists "submissions public insert" on public.submissions;
create policy "submissions public insert" on public.submissions for insert to anon, authenticated
  with check (status = 'new' and notes is null);
drop policy if exists "submissions editors read" on public.submissions;
create policy "submissions editors read" on public.submissions for select to authenticated using ((select public.is_editor()));
drop policy if exists "submissions editors update" on public.submissions;
create policy "submissions editors update" on public.submissions for update to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));
drop policy if exists "submissions admins delete" on public.submissions;
create policy "submissions admins delete" on public.submissions for delete to authenticated using ((select public.is_admin()));

-- ─── Médiathèque (Storage) ───────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml', 'video/mp4', 'application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media editors insert" on storage.objects;
create policy "media editors insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_editor()));
drop policy if exists "media editors update" on storage.objects;
create policy "media editors update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_editor()));
drop policy if exists "media editors delete" on storage.objects;
create policy "media editors delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_editor()));
drop policy if exists "media editors list" on storage.objects;
create policy "media editors list" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select public.is_editor()));
