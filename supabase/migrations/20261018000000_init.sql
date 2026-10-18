-- Lendly schema: people you lend to, the loans, and repayments.
-- Every row belongs to the signed-in user; Row Level Security enforces it.

create table public.borrowers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now()
);

create table public.loans (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  borrower_id      uuid not null references public.borrowers (id) on delete cascade,
  principal_cents  bigint not null check (principal_cents > 0),
  interest_rate    numeric(6, 2) not null default 0 check (interest_rate >= 0),
  lent_on          date not null default current_date,
  due_on           date not null,
  note             text,
  written_off_on   date,
  created_at       timestamptz not null default now()
);

create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  loan_id       uuid not null references public.loans (id) on delete cascade,
  amount_cents  bigint not null check (amount_cents > 0),
  paid_on       date not null default current_date,
  note          text,
  created_at    timestamptz not null default now()
);

create index borrowers_user_idx on public.borrowers (user_id);
create index loans_user_due_idx on public.loans (user_id, due_on);
create index loans_borrower_idx on public.loans (borrower_id);
create index payments_loan_idx on public.payments (loan_id);

alter table public.borrowers enable row level security;
alter table public.loans enable row level security;
alter table public.payments enable row level security;

create policy "Own borrowers" on public.borrowers
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Own loans" on public.loans
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.borrowers b where b.id = borrower_id and b.user_id = (select auth.uid()))
  );

create policy "Own payments" on public.payments
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.loans l where l.id = loan_id and l.user_id = (select auth.uid()))
  );
