-- Lendly is shared by a small, fixed group (you and your partner): everyone on the
-- allowlist sees and edits the same ledger, and nobody else can read anything.
--
-- Add the people who may use the app (lower-case emails) from the SQL editor:
--   insert into public.allowed_emails (email) values ('you@example.com'), ('partner@example.com');

create table public.allowed_emails (
  email      text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

-- RLS on with no policies: the list is only manageable from the dashboard / service role.
alter table public.allowed_emails enable row level security;

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.allowed_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke execute on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated;

-- user_id now records who added a row, not who may see it.
comment on column public.borrowers.user_id is 'Member who added this person';
comment on column public.loans.user_id is 'Member who recorded this loan';
comment on column public.payments.user_id is 'Member who recorded this payment';

drop policy "Own borrowers" on public.borrowers;
drop policy "Own loans" on public.loans;
drop policy "Own payments" on public.payments;

create policy "Members share borrowers" on public.borrowers
  for all to authenticated
  using ((select public.is_member()))
  with check ((select public.is_member()));

create policy "Members share loans" on public.loans
  for all to authenticated
  using ((select public.is_member()))
  with check ((select public.is_member()));

create policy "Members share payments" on public.payments
  for all to authenticated
  using ((select public.is_member()))
  with check ((select public.is_member()));
