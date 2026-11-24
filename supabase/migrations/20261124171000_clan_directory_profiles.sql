begin;

create or replace function public.gymbro_clan_directory_detail(p_clan_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', c.id, 'name', c.name, 'tag', c.tag, 'capacity', gymbro_game.clan_capacity(),
    'viewerClan', (select me.clan_id from public.profiles as me where me.id = auth.uid()),
    'members', jsonb_agg(jsonb_build_object('id', p.id, 'nick', p.username, 'level', coalesce(p.level, 1), 'leader', p.id = c.owner_id)
      order by (p.id = c.owner_id) desc, p.username)
  )
  from public.clans as c
  join public.profiles as p on p.clan_id = c.id
  where (select auth.uid()) is not null and c.id = p_clan_id and c.listed
  group by c.id;
$$;

-- The clan catalog shows avatar cosmetics and lift records only.
create function public.gymbro_clan_directory_member(p_clan_id uuid, p_member_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id, 'username', p.username, 'level', p.level, 'worn', p.worn,
    'equipped_skin', p.equipped_skin, 'best_lifts', p.best_lifts,
    'app_data', jsonb_build_object('wardrobe', jsonb_build_object(
      'tattoos', p.app_data->'wardrobe'->'tattoos',
      'model', p.app_data->'wardrobe'->'model',
      'background', p.app_data->'wardrobe'->'background'
    ))
  )
  from public.profiles as p join public.clans as c on c.id = p.clan_id
  where (select auth.uid()) is not null and c.listed and c.id = p_clan_id and p.id = p_member_id;
$$;

revoke execute on function public.gymbro_clan_directory_member(uuid,uuid) from public, anon, authenticated;
grant execute on function public.gymbro_clan_directory_member(uuid,uuid) to authenticated;
notify pgrst, 'reload schema';

commit;
