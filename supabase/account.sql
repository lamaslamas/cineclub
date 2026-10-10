-- Run once in the Supabase SQL editor. No personal film data enters GitHub.
create table if not exists public.cineclub_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  constraint cineclub_payload_size check (octet_length(payload::text) <= 20971520)
);
alter table public.cineclub_profiles enable row level security;
revoke all on public.cineclub_profiles from anon, authenticated;
grant select on public.cineclub_profiles to authenticated;
drop policy if exists "Read own cinema" on public.cineclub_profiles;
create policy "Read own cinema" on public.cineclub_profiles
  for select to authenticated using ((select auth.uid()) = user_id);

-- Compare revision before writing so two devices cannot silently overwrite data.
create or replace function public.cineclub_save(expected_revision bigint, next_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); saved public.cineclub_profiles;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if expected_revision < 0 or expected_revision is null
    or next_payload is null or jsonb_typeof(next_payload) <> 'object'
    or next_payload ->> 'format' is distinct from 'cineclub-backup'
    or next_payload ->> 'version' is distinct from '1'
    or jsonb_typeof(next_payload -> 'data') is distinct from 'object'
    or jsonb_typeof(next_payload -> 'movies') is distinct from 'array'
    or octet_length(next_payload::text) > 20971520 then
    raise exception 'Invalid cinema snapshot';
  end if;
  if expected_revision = 0 then
    insert into public.cineclub_profiles (user_id, payload)
      values (actor, next_payload) on conflict (user_id) do nothing
      returning * into saved;
  else
    update public.cineclub_profiles set payload = next_payload,
      revision = revision + 1, updated_at = now()
      where user_id = actor and revision = expected_revision returning * into saved;
  end if;
  if saved.user_id is null then return jsonb_build_object('conflict', true); end if;
  return jsonb_build_object('revision', saved.revision, 'updated_at', saved.updated_at);
end;
$$;
revoke all on function public.cineclub_save(bigint,jsonb) from public, anon;
grant execute on function public.cineclub_save(bigint,jsonb) to authenticated;
