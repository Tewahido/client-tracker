-- Atomic backup restore.
--
-- The app used to delete the organisation's ledger and then insert people, loans and
-- payments in separate requests; a failure part-way left the organisation empty for
-- everyone. This function does it all in one transaction: it either fully succeeds or
-- changes nothing. It runs with the caller's rights, so RLS and triggers still apply.

create function public.restore_snapshot(p_org uuid, p_borrowers jsonb, p_loans jsonb, p_payments jsonb)
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

  insert into public.loans (id, org_id, borrower_id, principal_cents, interest_rate, lent_on, due_on, note, written_off_on, created_at)
  select r.id, p_org, r.borrower_id, r.principal_cents, coalesce(r.interest_rate, 0), r.lent_on, r.due_on, r.note, r.written_off_on,
         coalesce(r.created_at, now())
  from jsonb_to_recordset(p_loans) as r(
    id uuid, borrower_id uuid, principal_cents bigint, interest_rate numeric, lent_on date, due_on date,
    note text, written_off_on date, created_at timestamptz
  );

  insert into public.payments (id, org_id, loan_id, amount_cents, paid_on, note, created_at)
  select r.id, p_org, r.loan_id, r.amount_cents, r.paid_on, r.note, coalesce(r.created_at, now())
  from jsonb_to_recordset(p_payments) as r(id uuid, loan_id uuid, amount_cents bigint, paid_on date, note text, created_at timestamptz);
end;
$$;

revoke execute on function public.restore_snapshot(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.restore_snapshot(uuid, jsonb, jsonb, jsonb) to authenticated;
