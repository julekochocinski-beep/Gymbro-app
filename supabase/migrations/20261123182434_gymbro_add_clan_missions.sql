create function gymbro_game.clan_mission_progress(p_player uuid,p_clan uuid)
returns jsonb language sql stable set search_path = '' as $$
  with dates as (
    select date_trunc('week',now() at time zone 'Europe/Warsaw')::date as week,
      gymbro_game.season_start((now() at time zone 'Europe/Warsaw')::date) as season
  ), attacks as (
    select user_id,clan_id,week,zones
    from gymbro_game.workouts
    where week>=date '2026-11-23' and cardinality(zones)>0
  ), player_battles as (
    select distinct clan_id,week from attacks where user_id=p_player
  ), earned_weeks as (
    select distinct b.week
    from player_battles b join attacks a using(clan_id,week)
    group by b.clan_id,b.week
    having count(distinct a.user_id)>=3
  ), season_zones as (
    select gymbro_game.season_start(a.week) as season,count(distinct z.zone) as score
    from attacks a cross join lateral unnest(a.zones) as z(zone)
    where a.user_id=p_player
    group by 1
  )
  select jsonb_build_object(
    'zones',coalesce((select score from season_zones s where s.season=dates.season),0),
    'crew',case when exists(select from earned_weeks e where e.week=dates.week) then 3 else
      (select least(3,count(distinct a.user_id)) from attacks a where a.clan_id=p_clan and a.week=dates.week) end,
    'crewDone',exists(select from earned_weeks e where e.week=dates.week),
    'earned',5*(select count(*) from earned_weeks)+15*(select count(*) from season_zones where score>=3)
  ) from dates;
$$;

revoke all on function gymbro_game.clan_mission_progress(uuid,uuid) from public,anon,authenticated;

create or replace function gymbro_game.current_challenges()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  player uuid := auth.uid();
  snapshot jsonb;
  battle jsonb;
  eligible_from date;
begin
  if player is null then raise insufficient_privilege; end if;
  snapshot := gymbro_game.golem_snapshot();
  battle := snapshot->'battle';
  if jsonb_typeof(battle)='object' then
    select gymbro_game.eligible_week(p.clan_joined_at) into eligible_from
    from public.profiles as p where p.id=player;
    battle := battle || jsonb_build_object(
      'eligible',coalesce(eligible_from<=(battle->>'week')::date,false),
      'eligibleFrom',eligible_from
    );
  end if;
  return jsonb_build_object('battle',battle,'trophy',gymbro_game.player_artifacts(player)||jsonb_build_object(
    'missions',gymbro_game.clan_mission_progress(player,(battle->>'clan')::uuid)
  ));
end;
$$;
