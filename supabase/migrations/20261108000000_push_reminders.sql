-- Reminders that arrive with the app closed (Web Push).
--
-- push_subscriptions: one row per device that turned reminders on. The endpoint is that
-- device's private address at Apple's or Google's push service; with it and our VAPID key
-- anyone could message the device, so only its owner may read it. Rows are saved through
-- save_push_subscription (a device belongs to whoever signed in on it last) and read by the
-- send-reminders Edge Function with the service role.
--
-- push_reminder_log: which reminders each person was already sent, so the daily job sends
-- each reminder stage once. Service role only.

create table public.push_subscriptions (
  -- Only the browsers' push services (Google, Mozilla, Apple, Microsoft): the daily job POSTs
  -- to every saved address, so anything else would let a user make it call their own server.
  endpoint      text primary key check (
    endpoint ~ '^https://(fcm\.googleapis\.com|[a-z0-9.-]+\.push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/[^\s]+$'
    and length(endpoint) <= 2048
  ),
  user_id       uuid not null references auth.users (id) on delete cascade,
  p256dh        text not null check (length(p256dh) between 1 and 200),
  auth          text not null check (length(auth) between 1 and 100),
  -- "Start reminding me N days before", as chosen on that device.
  reminder_days int not null default 3 check (reminder_days between 1 and 30),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

revoke all on public.push_subscriptions from public, anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;

create policy "People see their own devices" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());

create policy "People remove their own devices" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());

create function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_reminder_days int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Sign in to turn on reminders' using errcode = '42501';
  end if;

  -- Each device gets a daily push; keep one person from registering an unbounded number.
  if (select count(*) from public.push_subscriptions where user_id = me and endpoint <> p_endpoint) >= 10 then
    raise exception 'Reminders are on for 10 devices already. Turn them off on one you no longer use.'
      using errcode = 'P0001';
  end if;

  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth, reminder_days)
  values (p_endpoint, me, p_p256dh, p_auth, p_reminder_days)
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        reminder_days = excluded.reminder_days,
        updated_at = now();
end;
$$;

revoke execute on function public.save_push_subscription(text, text, text, int) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, int) to authenticated;

create table public.push_reminder_log (
  user_id      uuid not null references auth.users (id) on delete cascade,
  reminder_key text not null,
  sent_at      timestamptz not null default now(),
  primary key (user_id, reminder_key)
);

alter table public.push_reminder_log enable row level security;
revoke all on public.push_reminder_log from public, anon, authenticated;
