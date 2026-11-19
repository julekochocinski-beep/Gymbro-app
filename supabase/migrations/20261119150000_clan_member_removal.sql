begin;

create or replace function public.gymbro_remove_clan_member(p_clan_id text, p_member_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller_id uuid := auth.uid();
  current_clan_id public.clans.id%type;
begin
  if caller_id is null or p_member_id is null or p_member_id = caller_id then
    raise exception 'Only the clan leader can remove another member.' using errcode = '42501';
  end if;

  select clan.id into current_clan_id
  from public.profiles as leader
  join public.clans as clan on clan.id = leader.clan_id
  where leader.id = caller_id
    and clan.owner_id = caller_id
    and clan.id::text = p_clan_id
  for update of leader, clan;

  if not found then
    raise exception 'Only the clan leader can remove another member.' using errcode = '42501';
  end if;

  update public.profiles as member
  set clan_id = null
  where member.id = p_member_id
    and member.clan_id = current_clan_id;

  return found;
end;
$function$;

revoke execute on function public.gymbro_remove_clan_member(text, uuid) from public, anon, authenticated;
grant execute on function public.gymbro_remove_clan_member(text, uuid) to authenticated;

commit;
