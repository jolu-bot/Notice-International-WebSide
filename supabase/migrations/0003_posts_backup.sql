-- ═══════════════════════════════════════════════════════════════════
-- Actualités (rubrique /fr/actualites — /en/news) et sauvegarde hebdomadaire.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Actualités ─────────────────────────────────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 90),
  category text not null default 'agence' check (category in ('agence', 'evenement', 'realisation', 'conseil', 'immo')),
  title_fr text not null check (char_length(title_fr) between 3 and 160),
  title_en text not null default '' check (char_length(title_en) <= 160),
  excerpt_fr text not null default '' check (char_length(excerpt_fr) <= 400),
  excerpt_en text not null default '' check (char_length(excerpt_en) <= 400),
  body_fr text not null default '' check (char_length(body_fr) <= 40000),
  body_en text not null default '' check (char_length(body_en) <= 40000),
  cover text not null default '' check (char_length(cover) <= 500),
  published boolean not null default false,
  published_at timestamptz not null default now(),
  author_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_published_idx on public.posts (published, published_at desc);
alter table public.posts enable row level security;

-- Public : uniquement les articles publiés dont la date est passée (les autres sont « programmés »)
create policy "posts public read" on public.posts for select to anon, authenticated
  using (published and published_at <= now());
create policy "posts editors read" on public.posts for select to authenticated using ((select public.is_editor()));
create policy "posts editors insert" on public.posts for insert to authenticated with check ((select public.is_editor()));
create policy "posts editors update" on public.posts for update to authenticated using ((select public.is_editor())) with check ((select public.is_editor()));
create policy "posts admins delete" on public.posts for delete to authenticated using ((select public.is_admin()));

revoke all on public.posts from anon, authenticated;
grant select on public.posts to anon, authenticated;
grant insert (slug, category, title_fr, title_en, excerpt_fr, excerpt_en, body_fr, body_en, cover, published, published_at) on public.posts to authenticated;
grant update (slug, category, title_fr, title_en, excerpt_fr, excerpt_en, body_fr, body_en, cover, published, published_at) on public.posts to authenticated;
grant delete on public.posts to authenticated;

create or replace function public.posts_touch() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  new.author_email := coalesce(auth.jwt() ->> 'email', new.author_email);
  return new;
end $$;
revoke all on function public.posts_touch() from public, anon, authenticated;
create or replace trigger posts_touch before insert or update on public.posts for each row execute function public.posts_touch();

-- ─── Sauvegarde : instantané complet, protégé par un jeton secret ────
-- Le jeton est généré ici, dans la base ; il est recopié dans la variable Vercel BACKUP_TOKEN.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.secrets (name text primary key, value text not null);
insert into private.secrets (name, value)
  values ('backup_token', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (name) do nothing;

create or replace function public.backup_snapshot(p_token text) returns jsonb
language plpgsql security definer set search_path = public, private as $$
begin
  if p_token is null or p_token <> (select value from private.secrets where name = 'backup_token') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'generated_at', now(),
    'content', (select coalesce(jsonb_agg(to_jsonb(c) order by c.section, c.locale), '[]'::jsonb) from public.content c),
    'posts', (select coalesce(jsonb_agg(to_jsonb(p) order by p.published_at desc), '[]'::jsonb) from public.posts p),
    'submissions', (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at desc), '[]'::jsonb) from public.submissions s),
    'content_revisions', (select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) from (select * from public.content_revisions order by created_at desc limit 300) r),
    'profiles', (select coalesce(jsonb_agg(jsonb_build_object('email', email, 'full_name', full_name, 'role', role, 'active', active)), '[]'::jsonb) from public.profiles),
    'media', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'size', metadata ->> 'size', 'created_at', created_at)), '[]'::jsonb) from storage.objects where bucket_id = 'media')
  );
end $$;
revoke all on function public.backup_snapshot(text) from public, authenticated;
grant execute on function public.backup_snapshot(text) to anon;
