begin;

alter table public.clans add column listed boolean not null default false;
create index profiles_clan_directory on public.profiles(clan_id) where clan_id is not null;

create function gymbro_game.clan_capacity() returns integer
language sql immutable set search_path = '' as $$ select 10 $$;

-- Serialize incoming memberships for each clan, including invites handled by older clients.
create function gymbro_game.check_clan_capacity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.clan_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.clan_id is not distinct from old.clan_id then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('gymbro-clan-members:' || new.clan_id::text, 0));
  if (select count(*) from public.profiles where clan_id = new.clan_id) >= gymbro_game.clan_capacity() then
    raise exception using message = 'clan_full', errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger gymbro_clan_capacity
before insert or update of clan_id on public.profiles
for each row execute function gymbro_game.check_clan_capacity();

create function public.gymbro_clan_directory(p_search text default '')
returns table (id uuid, name text, tag text, place bigint, points integer, members integer, capacity integer)
language sql stable security definer set search_path = '' as $$
  with listed_clans as (
    select c.id, c.name, c.tag, m.members, s.points
    from public.clans as c
    cross join lateral (
      select count(*)::integer as members from public.profiles as p where p.clan_id = c.id
    ) as m
    cross join lateral (
      select count(distinct (w.user_id,w.day))::integer as points
      from gymbro_game.workouts as w
      where w.clan_id = c.id and w.week = date_trunc('week', now() at time zone 'Europe/Warsaw')::date
    ) as s
    where (select auth.uid()) is not null and c.listed and m.members > 0
  ), ranked as (
    select c.*, rank() over (order by c.points desc) as place from listed_clans as c
  )
  select c.id, c.name, c.tag, c.place, c.points, c.members, gymbro_game.clan_capacity()
  from ranked as c
  where strpos(lower(c.name), lower(btrim(left(coalesce(p_search, ''), 40)))) > 0
     or strpos(lower(c.tag), lower(btrim(left(coalesce(p_search, ''), 40), ' #[]'))) > 0
     or btrim(coalesce(p_search, '')) = ''
  order by c.place, c.name, c.id
  limit 30;
$$;

create function public.gymbro_clan_directory_detail(p_clan_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', c.id, 'name', c.name, 'tag', c.tag, 'capacity', gymbro_game.clan_capacity(),
    'members', jsonb_agg(jsonb_build_object('nick', p.username, 'level', coalesce(p.level, 1), 'leader', p.id = c.owner_id)
      order by (p.id = c.owner_id) desc, p.username)
  )
  from public.clans as c
  join public.profiles as p on p.clan_id = c.id
  where (select auth.uid()) is not null and c.id = p_clan_id and c.listed
  group by c.id;
$$;

create function public.gymbro_set_clan_listed(p_clan_id uuid, p_listed boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.clans as c set listed = p_listed
  where c.id = p_clan_id and c.owner_id = auth.uid()
    and exists (select from public.profiles as p where p.id = c.owner_id and p.clan_id = c.id);
  if not found then raise insufficient_privilege; end if;
  return p_listed;
end;
$$;

create function public.gymbro_join_listed_clan(p_clan_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  player uuid := auth.uid();
  current_clan uuid;
begin
  if player is null then raise insufficient_privilege; end if;
  select p.clan_id into current_clan from public.profiles as p where p.id = player for update;
  if not found then return 'profile_required'; end if;
  if current_clan = p_clan_id then return 'joined'; end if;
  if current_clan is not null then return 'already_in_clan'; end if;

  perform from public.clans as c where c.id = p_clan_id and c.listed for share;
  if not found then return 'unavailable'; end if;
  if not exists (select from public.profiles as p where p.clan_id = p_clan_id) then return 'unavailable'; end if;

  update public.profiles set clan_id = p_clan_id where id = player;
  return 'joined';
end;
$$;

revoke execute on function gymbro_game.clan_capacity(), gymbro_game.check_clan_capacity(),
  public.gymbro_clan_directory(text), public.gymbro_clan_directory_detail(uuid),
  public.gymbro_set_clan_listed(uuid,boolean), public.gymbro_join_listed_clan(uuid)
from public, anon, authenticated;

grant execute on function public.gymbro_clan_directory(text), public.gymbro_clan_directory_detail(uuid),
  public.gymbro_set_clan_listed(uuid,boolean), public.gymbro_join_listed_clan(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
