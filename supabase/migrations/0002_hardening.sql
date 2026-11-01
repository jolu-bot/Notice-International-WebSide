-- ═══════════════════════════════════════════════════════════════════
-- Durcissement (2026-11-01) : droits au plus juste, anti-spam en base,
-- médiathèque sans SVG. Idempotent — peut être rejoué sans risque.
-- ═══════════════════════════════════════════════════════════════════

-- Droits au plus juste (en plus des règles RLS déjà en place)
revoke insert, update, delete, truncate, references, trigger on public.profiles from anon, authenticated;
revoke select on public.profiles from anon;
grant update (full_name) on public.profiles to authenticated;

revoke select, update, delete, truncate, references, trigger on public.submissions from anon;
revoke insert, update, truncate, references, trigger on public.submissions from authenticated;
revoke insert on public.submissions from anon;
grant insert (kind, locale, name, email, phone, data) on public.submissions to anon, authenticated;
grant update (status, notes) on public.submissions to authenticated;

revoke insert, update, delete, truncate, references, trigger on public.content from anon;
revoke truncate, references, trigger on public.content from authenticated;
revoke all on public.content_revisions from anon;
revoke insert, update, delete, truncate, references, trigger on public.content_revisions from authenticated;

-- Anti-spam au niveau de la base : même si quelqu'un contourne le site et écrit directement avec la clé publique
create index if not exists submissions_created_at_idx on public.submissions (created_at desc);
create index if not exists submissions_email_idx on public.submissions (lower(email), created_at desc);

create or replace function public.submissions_throttle() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.status := 'new';
  new.notes := null;
  new.created_at := now();
  if (select count(*) from public.submissions where created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if (select count(*) from public.submissions where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.submissions_throttle() from public, anon, authenticated;
create or replace trigger submissions_throttle before insert on public.submissions for each row execute function public.submissions_throttle();

-- Médiathèque : plus de SVG (un SVG peut embarquer du script)
update storage.buckets set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','application/pdf'] where id = 'media';
