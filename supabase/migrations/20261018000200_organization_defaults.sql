-- Organisation-wide lending defaults, set by owners (the existing "Owners can
-- rename" update policy covers these columns). New loans are pre-filled from them,
-- and every member sees amounts in the same currency.

alter table public.organizations
  add column currency text not null default 'ZAR' check (currency ~ '^[A-Z]{3}$'),
  add column default_term_days integer not null default 30 check (default_term_days between 1 and 3650),
  add column default_interest_rate numeric(6, 2) not null default 0 check (default_interest_rate between 0 and 1000);

comment on column public.organizations.default_term_days is 'Days between lending and the due date for new loans';
comment on column public.organizations.default_interest_rate is 'Flat interest percentage pre-filled on new loans';
