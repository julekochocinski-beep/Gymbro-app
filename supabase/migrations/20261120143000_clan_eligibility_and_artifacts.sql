begin;

alter table public.profiles add column clan_joined_at timestamptz;

-- Existing memberships can participate in the first battle after launch.
update public.profiles
set clan_joined_at = (date_trunc('week', clock_timestamp() at time zone 'Europe/Warsaw') - interval '7 days')
  at time zone 'Europe/Warsaw'
where clan_id is not null;

create function gymbro_game.track_clan_join()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.clan_id is null then
    new.clan_joined_at := null;
  elsif tg_op = 'INSERT' then
    new.clan_joined_at := clock_timestamp();
  elsif new.clan_id is distinct from old.clan_id then
    new.clan_joined_at := clock_timestamp();
  else
    new.clan_joined_at := old.clan_joined_at;
  end if;
  return new;
end;
$$;

create trigger gymbro_track_clan_join
before insert or update on public.profiles
for each row execute function gymbro_game.track_clan_join();

create function gymbro_game.eligible_week(joined_at timestamptz)
returns date language sql immutable strict set search_path = '' as $$
  select date_trunc('week', joined_at at time zone 'Europe/Warsaw')::date + 7;
$$;

create function gymbro_game.require_clan_eligibility()
returns trigger language plpgsql set search_path = '' as $$
begin
  if exists (
    select from public.profiles as member
    where member.id=new.user_id and member.clan_id=new.clan_id
      and gymbro_game.eligible_week(member.clan_joined_at)<=new.week
  ) then
    return new;
  end if;
  return null;
end;
$$;

create trigger gymbro_eligible_workout
before insert on gymbro_game.workouts
for each row execute function gymbro_game.require_clan_eligibility();

create trigger gymbro_eligible_award
before insert on gymbro_game.awards
for each row execute function gymbro_game.require_clan_eligibility();

create function gymbro_game.season_start(week_date date)
returns date language sql immutable strict set search_path = '' as $$
  select date_bin(interval '28 days', week_date::timestamp, timestamp '2026-11-16')::date;
$$;

create function gymbro_game.player_artifacts(p_player uuid)
returns jsonb language sql stable set search_path = '' as $$
  with this_season as (
    select gymbro_game.season_start((now() at time zone 'Europe/Warsaw')::date) as start_date
  ), season_scores as (
    select gymbro_game.season_start(a.week) as start_date, count(distinct a.week) as weeks_won
    from gymbro_game.awards as a
    where a.user_id=p_player and a.week>=date '2026-11-16'
    group by 1
  ), first_win as (
    select a.won_at, a.clan_name
    from gymbro_game.awards as a
    where a.user_id=p_player
    order by a.won_at, a.clan_id
    limit 1
  )
  select jsonb_build_object(
    'wins',(select count(*) from gymbro_game.awards as a where a.user_id=p_player),
    'firstAt',(select won_at from first_win),
    'firstClan',(select clan_name from first_win),
    'seasonWins',(select count(*) from season_scores where weeks_won>=2),
    'seasonStart',this_season.start_date,
    'seasonEnd',this_season.start_date+27,
    'seasonCount',least(2,coalesce((select weeks_won from season_scores where start_date=this_season.start_date),0))
  ) from this_season;
$$;

create function gymbro_game.current_challenges()
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
  return jsonb_build_object('battle',battle,'trophy',gymbro_game.player_artifacts(player));
end;
$$;

create function gymbro_game.member_artifacts(p_member_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  player uuid := auth.uid();
begin
  if player is null then raise insufficient_privilege; end if;
  if p_member_id=player or exists (
    select from public.profiles as me join public.profiles as peer on peer.clan_id=me.clan_id
    where me.id=player and peer.id=p_member_id
  ) or exists (
    select from public.friendships as f where f.status='accepted'
      and ((f.user_a=player and f.user_b=p_member_id) or (f.user_b=player and f.user_a=p_member_id))
  ) then
    return gymbro_game.player_artifacts(p_member_id) - 'seasonStart' - 'seasonEnd' - 'seasonCount';
  end if;
  return null;
end;
$$;

create or replace function public.gymbro_golem_snapshot()
returns jsonb language sql stable set search_path = '' as $$
  select gymbro_game.current_challenges();
$$;

create function public.gymbro_member_artifacts(p_member_id uuid)
returns jsonb language sql stable set search_path = '' as $$
  select gymbro_game.member_artifacts(p_member_id);
$$;

revoke execute on function gymbro_game.track_clan_join(), gymbro_game.eligible_week(timestamptz),
  gymbro_game.require_clan_eligibility(), gymbro_game.season_start(date), gymbro_game.player_artifacts(uuid),
  gymbro_game.current_challenges(), gymbro_game.member_artifacts(uuid), public.gymbro_member_artifacts(uuid)
from public, anon, authenticated;
grant execute on function gymbro_game.current_challenges(), gymbro_game.member_artifacts(uuid),
  public.gymbro_member_artifacts(uuid) to authenticated;

commit;
