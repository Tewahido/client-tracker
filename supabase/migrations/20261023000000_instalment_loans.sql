-- Instalment loans.
--
-- Not every loan comes back in one go. An instalment loan is repaid monthly:
-- `instalment_count` payments, the first on `first_due_on` and one a month after
-- that, with `due_on` holding the last one. `total_due_cents` keeps the agreed
-- total exactly (R2,000 x 12 = R24,000) rather than deriving it from the interest
-- rate, which only has two decimals. Once-off loans leave all three empty and
-- behave as before.

alter table public.loans
  add column instalment_count integer check (instalment_count between 2 and 360),
  add column first_due_on date,
  add column total_due_cents bigint check (total_due_cents > 0),
  add constraint loans_instalment_plan check (
    (instalment_count is null and first_due_on is null)
    or (
      instalment_count is not null
      and first_due_on is not null
      and first_due_on >= lent_on
      and total_due_cents is not null
      -- At least one cent per instalment.
      and total_due_cents >= instalment_count
      -- Same month arithmetic as the app: 31 Jan + 1 month = 28/29 Feb.
      and due_on = (first_due_on + make_interval(months => instalment_count - 1))::date
    )
  );

-- Restores carry the plan too. Same function as before, plus the three columns.
create or replace function public.restore_snapshot(p_org uuid, p_borrowers jsonb, p_loans jsonb, p_payments jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_org_owner(p_org) then
    raise exception 'Only organisation owners can restore backups';
  end if;

  -- Deleting people cascades to their loans and payments.
  delete from public.borrowers where org_id = p_org;

  insert into public.borrowers (id, org_id, name, phone, email, notes, created_at)
  select r.id, p_org, r.name, r.phone, r.email, r.notes, coalesce(r.created_at, now())
  from jsonb_to_recordset(p_borrowers) as r(id uuid, name text, phone text, email text, notes text, created_at timestamptz);

  insert into public.loans (
    id, org_id, borrower_id, principal_cents, interest_rate, lent_on, due_on, note, written_off_on,
    instalment_count, first_due_on, total_due_cents, created_at
  )
  select r.id, p_org, r.borrower_id, r.principal_cents, coalesce(r.interest_rate, 0), r.lent_on, r.due_on, r.note, r.written_off_on,
         r.instalment_count, r.first_due_on, r.total_due_cents, coalesce(r.created_at, now())
  from jsonb_to_recordset(p_loans) as r(
    id uuid, borrower_id uuid, principal_cents bigint, interest_rate numeric, lent_on date, due_on date,
    note text, written_off_on date, instalment_count integer, first_due_on date, total_due_cents bigint, created_at timestamptz
  );

  insert into public.payments (id, org_id, loan_id, amount_cents, paid_on, note, created_at)
  select r.id, p_org, r.loan_id, r.amount_cents, r.paid_on, r.note, coalesce(r.created_at, now())
  from jsonb_to_recordset(p_payments) as r(id uuid, loan_id uuid, amount_cents bigint, paid_on date, note text, created_at timestamptz);
end;
$$;
