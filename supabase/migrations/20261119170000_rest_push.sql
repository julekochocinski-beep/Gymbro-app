begin;

create table public.gymbro_rest_push_devices (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  version bigint not null default 0,
  due_at timestamptz,
  available_at timestamptz,
  language text not null default 'pl',
  attempts integer not null default 0,
  claim_token uuid,
  primary key (user_id, device_id)
);

create index gymbro_rest_push_due on public.gymbro_rest_push_devices (available_at)
  where due_at is not null;

alter table public.gymbro_rest_push_devices enable row level security;
revoke all on public.gymbro_rest_push_devices from public, anon, authenticated;

create function public.gymbro_register_rest_push(p_device_id uuid, p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_device_id is null
    or p_endpoint is null or length(p_endpoint) > 2048
    or p_endpoint !~ '^https://(web\.push\.apple\.com/|fcm\.googleapis\.com/(fcm/send|wp)/|updates\.push\.services\.mozilla\.com/wpush/v[0-9]+/)[^[:space:]#]+$'
    or p_p256dh is null or p_p256dh !~ '^[A-Za-z0-9_-]{87}=?$'
    or p_auth is null or p_auth !~ '^[A-Za-z0-9_-]{22}={0,2}$' then
    raise exception 'Invalid push subscription' using errcode = '22023';
  end if;

  insert into public.gymbro_rest_push_devices (user_id, device_id, endpoint, p256dh, auth_key)
  values (caller_id, p_device_id, p_endpoint, p_p256dh, p_auth)
  on conflict (user_id, device_id) do update
    set endpoint = excluded.endpoint, p256dh = excluded.p256dh, auth_key = excluded.auth_key;
end;
$$;

create function public.gymbro_set_rest_push(p_device_id uuid, p_version bigint, p_due_at timestamptz, p_language text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_device_id is null or p_version is null or p_version not between 1 and 9007199254740991
    or p_language is null or p_language not in ('pl', 'en')
    or p_due_at < now() - interval '15 seconds' or p_due_at > now() + interval '2 hours' then
    raise exception 'Invalid rest schedule' using errcode = '22023';
  end if;

  update public.gymbro_rest_push_devices
  set version = p_version, due_at = p_due_at, available_at = p_due_at,
      language = p_language, attempts = 0, claim_token = null
  where user_id = caller_id and device_id = p_device_id and version < p_version;

  return found or exists (
    select 1 from public.gymbro_rest_push_devices
    where user_id = caller_id and device_id = p_device_id
  );
end;
$$;

create function public.gymbro_remove_rest_push(p_device_id uuid)
returns void
language sql security definer set search_path = ''
as $$
  delete from public.gymbro_rest_push_devices where user_id = auth.uid() and device_id = p_device_id;
$$;

create function public.gymbro_claim_rest_push()
returns table (
  token uuid, endpoint text, p256dh text, auth_key text, due_at timestamptz, language text
)
language sql security definer set search_path = ''
as $$
  with jobs as (
    select d.user_id, d.device_id from public.gymbro_rest_push_devices d
    where d.available_at <= now() and d.due_at > now() - interval '40 seconds' and d.attempts < 3
    order by d.available_at
    limit 20
    for update skip locked
  )
  update public.gymbro_rest_push_devices d
  set claim_token = gen_random_uuid(), attempts = d.attempts + 1, available_at = now() + interval '15 seconds'
  from jobs
  where (d.user_id, d.device_id) = (jobs.user_id, jobs.device_id)
  returning d.claim_token, d.endpoint, d.p256dh, d.auth_key, d.due_at, d.language;
$$;

create function public.gymbro_settle_rest_push(p_token uuid, p_result text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_result = 'gone' then
    delete from public.gymbro_rest_push_devices where claim_token = p_token;
  elsif p_result = 'retry' then
    update public.gymbro_rest_push_devices
    set available_at = now() + interval '5 seconds', claim_token = null
    where claim_token = p_token;
  else
    update public.gymbro_rest_push_devices
    set due_at = null, available_at = null, claim_token = null
    where claim_token = p_token;
  end if;
end;
$$;

revoke execute on function public.gymbro_register_rest_push(uuid, text, text, text) from public, anon, authenticated, service_role;
revoke execute on function public.gymbro_set_rest_push(uuid, bigint, timestamptz, text) from public, anon, authenticated, service_role;
revoke execute on function public.gymbro_remove_rest_push(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.gymbro_claim_rest_push() from public, anon, authenticated, service_role;
revoke execute on function public.gymbro_settle_rest_push(uuid, text) from public, anon, authenticated, service_role;

grant execute on function public.gymbro_register_rest_push(uuid, text, text, text) to authenticated;
grant execute on function public.gymbro_set_rest_push(uuid, bigint, timestamptz, text) to authenticated;
grant execute on function public.gymbro_remove_rest_push(uuid) to authenticated;
grant execute on function public.gymbro_claim_rest_push() to service_role;
grant execute on function public.gymbro_settle_rest_push(uuid, text) to service_role;

commit;
