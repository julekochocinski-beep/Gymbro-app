-- Uruchom po wdrożeniu funkcji i zapisaniu obu sekretów w Supabase Vault.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule('gymbro-rest-push', '5 seconds', $job$
  select net.http_post(
    url := rtrim(project.decrypted_secret, '/') || '/functions/v1/rest-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-GymBro-Worker', worker.decrypted_secret),
    timeout_milliseconds := 20000
  )
  from vault.decrypted_secrets project
  cross join vault.decrypted_secrets worker
  where project.name = 'gymbro_rest_push_project_url'
    and worker.name = 'gymbro_rest_push_worker_secret'
    and exists (
      select 1 from public.gymbro_rest_push_devices
      where available_at <= now() and due_at > now() - interval '40 seconds' and attempts < 3
    );
$job$);

-- Przy tak krótkim interwale ogranicz historię uruchomień tego zadania.
select cron.schedule('gymbro-rest-push-log-cleanup', '15 3 * * *', $job$
  delete from cron.job_run_details
  where jobid in (
    select jobid from cron.job where jobname = 'gymbro-rest-push' and username = current_user
  )
  and end_time < now() - interval '2 days';
$job$);
