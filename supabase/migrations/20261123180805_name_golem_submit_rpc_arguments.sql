create or replace function public.gymbro_golem_submit(
  p_clan_id uuid, p_workout_id text, p_finished timestamptz,
  p_muscles text[], p_primary text[]
)
returns void language sql security invoker set search_path = '' as $$
  select gymbro_game.submit_golem(p_clan_id,p_workout_id,p_finished,p_muscles,p_primary);
$$;

notify pgrst, 'reload schema';
