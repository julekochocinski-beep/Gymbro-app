begin;

create schema gymbro_game;
revoke all on schema gymbro_game from public, anon, authenticated;
grant usage on schema gymbro_game to authenticated;

create table gymbro_game.workouts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_id text not null,
  clan_id uuid not null references public.clans(id) on delete cascade,
  week date not null,
  day date not null,
  muscles text[] not null,
  zones text[] not null,
  primary key (user_id, workout_id)
);
create index golem_clan_week on gymbro_game.workouts(clan_id, week);
create unique index golem_one_attack_per_day on gymbro_game.workouts(user_id, day)
where cardinality(zones)>0;
alter table gymbro_game.workouts enable row level security;

create table gymbro_game.awards (
  user_id uuid not null references public.profiles(id) on delete cascade,
  clan_id uuid not null,
  week date not null,
  clan_name text not null,
  won_at timestamptz not null default now(),
  primary key (user_id, clan_id, week)
);
alter table gymbro_game.awards enable row level security;
create index golem_awards_clan_week on gymbro_game.awards(clan_id, week);

create policy golem_activity_insert on public.clan_messages as restrictive for insert to authenticated
with check (coalesce(payload->>'kind','') not in ('golem-crack','golem-win'));
create policy golem_activity_update on public.clan_messages as restrictive for update to authenticated
using (coalesce(payload->>'kind','') not in ('golem-crack','golem-win'))
with check (coalesce(payload->>'kind','') not in ('golem-crack','golem-win'));
create policy golem_activity_delete on public.clan_messages as restrictive for delete to authenticated
using (coalesce(payload->>'kind','') not in ('golem-crack','golem-win'));

create function gymbro_game.submit_golem(
  p_clan_id uuid, p_workout_id text, p_finished timestamptz,
  p_muscles text[], p_primary text[]
) returns void language plpgsql security definer set search_path = '' as $$
declare
  player uuid := auth.uid();
  local_day date := (p_finished at time zone 'Europe/Warsaw')::date;
  v_week date := date_trunc('week', now() at time zone 'Europe/Warsaw')::date;
  muscle_keys constant text[] := array['klatka','barki','barki_tyl','triceps','brzuch','skosy','biceps','przedramiona',
    'czworoglowe','czworoboczny','srodek_plecow','oble','dolny_grzbiet','najszerszy','posladki','dwuglowe','lydki'];
  goal constant integer := 3;
  zone text;
  nick text;
  clan_name text;
  hits integer;
  cracked text[] := '{}';
  attack text[] := '{}';
begin
  if player is null then raise insufficient_privilege; end if;
  if p_workout_id is null or p_workout_id !~ '^[0-9A-Za-z.-]{1,80}$'
     or p_finished is null or p_finished > now() + interval '5 minutes'
     or local_day < v_week or local_day >= v_week+7
     or p_muscles is null or p_primary is null
     or cardinality(p_muscles)>17 or cardinality(p_primary)>17
     or not p_muscles <@ muscle_keys or not p_primary <@ p_muscles
  then return; end if;

  -- Serialize attacks across tabs for the member and the entire weekly battle.
  perform pg_advisory_xact_lock(hashtextextended('golem-user:'||player::text,0));
  perform pg_advisory_xact_lock(hashtextextended('golem-clan:'||p_clan_id::text||':'||v_week::text,0));
  select c.name, p.username into clan_name, nick
  from public.profiles p join public.clans c on c.id=p.clan_id
  where p.id=player and c.id=p_clan_id for share of p;
  if not found then return; end if;

  if not exists (select from gymbro_game.awards a where a.clan_id=p_clan_id and a.week=v_week)
    and not exists (select from gymbro_game.workouts w where w.user_id=player and w.day=local_day and cardinality(w.zones)>0)
  then
    if p_primary && array['klatka'] then attack:=array_append(attack,'chest'); end if;
    if p_primary && array['czworoboczny','srodek_plecow','oble','dolny_grzbiet','najszerszy'] then attack:=array_append(attack,'back'); end if;
    if p_primary && array['czworoglowe','posladki','dwuglowe','lydki'] then attack:=array_append(attack,'legs'); end if;
  end if;

  insert into gymbro_game.workouts(user_id,workout_id,clan_id,week,day,muscles,zones)
  values (player,p_workout_id,p_clan_id,v_week,local_day,p_muscles,attack)
  on conflict do nothing;
  if not found or cardinality(attack)=0 then return; end if;

  foreach zone in array attack loop
    select count(*) into hits from gymbro_game.workouts w
    where w.clan_id=p_clan_id and w.week=v_week and zone=any(w.zones);
    if hits=goal then cracked:=array_append(cracked,zone); end if;
  end loop;

  if cardinality(cracked)>0 then
    insert into public.clan_messages(clan_id,user_id,username,type,content,payload,client_id)
    values (p_clan_id,player,nick,'activity','golem-crack',
      jsonb_build_object('kind','golem-crack','zones',cracked),'golem-crack:'||p_clan_id||':'||v_week||':'||player||':'||p_workout_id)
    on conflict (client_id) do nothing;
  end if;

  if not exists (
    select from unnest(array['chest','back','legs']) as armor(key)
    where (select count(*) from gymbro_game.workouts w
      where w.clan_id=p_clan_id and w.week=v_week and armor.key=any(w.zones))<goal
  ) then
    insert into gymbro_game.awards(user_id,clan_id,week,clan_name)
    select distinct w.user_id,p_clan_id,v_week,clan_name
    from gymbro_game.workouts w where w.clan_id=p_clan_id and w.week=v_week and cardinality(w.zones)>0
    on conflict do nothing;

    insert into public.clan_messages(clan_id,user_id,username,type,content,payload,client_id)
    values (p_clan_id,player,nick,'activity','golem-win',
      jsonb_build_object('kind','golem-win'),'golem-win:'||p_clan_id||':'||v_week)
    on conflict (client_id) do nothing;
  end if;
end;
$$;

create function gymbro_game.golem_snapshot()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  player uuid := auth.uid();
  clan uuid;
  v_week date := date_trunc('week',now() at time zone 'Europe/Warsaw')::date;
  battle jsonb;
  trophy jsonb;
begin
  if player is null then raise insufficient_privilege; end if;
  select p.clan_id into clan from public.profiles p where p.id=player;
  if clan is not null then
    select jsonb_build_object(
      'clan',clan,
      'week',v_week,
      'hits',coalesce((select jsonb_object_agg(key,count) from (
        select zone as key,count(*) as count
        from gymbro_game.workouts w cross join lateral unnest(w.zones) as z(zone)
        where w.clan_id=clan and w.week=v_week group by zone
      ) hits),'{}'::jsonb),
      'muscles',coalesce((select jsonb_object_agg(muscle,members) from (
        select key as muscle,jsonb_agg(distinct p.username order by p.username) as members
        from gymbro_game.workouts w join public.profiles p on p.id=w.user_id
        cross join lateral unnest(w.muscles) as m(key)
        where w.clan_id=clan and w.week=v_week group by key
      ) trained),'{}'::jsonb),
      'attackedToday',exists(select from gymbro_game.workouts w where w.user_id=player and
        w.day=(now() at time zone 'Europe/Warsaw')::date and cardinality(w.zones)>0),
      'won',exists(select from gymbro_game.awards a where a.clan_id=clan and a.week=v_week)
    ) into battle;
  end if;
  select jsonb_build_object('wins',count(*),'firstAt',(array_agg(won_at order by won_at))[1],
    'firstClan',(array_agg(clan_name order by won_at))[1])
  into trophy from gymbro_game.awards where user_id=player;
  return jsonb_build_object('battle',battle,'trophy',trophy);
end;
$$;

create function public.gymbro_golem_submit(uuid,text,timestamptz,text[],text[])
returns void language sql set search_path = '' as $$
  select gymbro_game.submit_golem($1,$2,$3,$4,$5);
$$;
create function public.gymbro_golem_snapshot()
returns jsonb language sql stable set search_path = '' as $$
  select gymbro_game.golem_snapshot();
$$;

revoke execute on function gymbro_game.submit_golem(uuid,text,timestamptz,text[],text[]),
  gymbro_game.golem_snapshot(),public.gymbro_golem_submit(uuid,text,timestamptz,text[],text[]),
  public.gymbro_golem_snapshot() from public, anon, authenticated;
grant execute on function gymbro_game.submit_golem(uuid,text,timestamptz,text[],text[]),
  gymbro_game.golem_snapshot(),public.gymbro_golem_submit(uuid,text,timestamptz,text[],text[]),
  public.gymbro_golem_snapshot() to authenticated;

commit;
