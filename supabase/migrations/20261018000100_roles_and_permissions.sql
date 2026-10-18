-- Roles and permissions.
--
--   owner   manage the organisation, and delete or forgive anything
--   member  add and edit people, loans and payments; remove payments they recorded
--   viewer  read-only
--
-- Note: the new enum value is not referenced by literal anywhere below (Postgres
-- forbids using a freshly added enum value in the same transaction); rules are
-- written in terms of owner/member instead.

alter type public.org_role add value if not exists 'viewer';

/* Owners and members may change the ledger; viewers may not. */
create function public.can_edit_org(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org and m.user_id = auth.uid() and m.role in ('owner', 'member')
  );
$$;

revoke execute on function public.can_edit_org(uuid) from public, anon;
grant execute on function public.can_edit_org(uuid) to authenticated;

-- Replace the blanket "for all" ledger policies with per-command ones.
drop policy "Members share borrowers" on public.borrowers;
drop policy "Members share loans" on public.loans;
drop policy "Members share payments" on public.payments;

-- People
create policy "Members can view people" on public.borrowers
  for select to authenticated
  using ((select public.is_org_member(org_id)));

create policy "Editors can add people" on public.borrowers
  for insert to authenticated
  with check ((select public.can_edit_org(org_id)));

create policy "Editors can edit people" on public.borrowers
  for update to authenticated
  using ((select public.can_edit_org(org_id)))
  with check ((select public.can_edit_org(org_id)));

create policy "Owners can delete people" on public.borrowers
  for delete to authenticated
  using ((select public.is_org_owner(org_id)));

-- Loans
create policy "Members can view loans" on public.loans
  for select to authenticated
  using ((select public.is_org_member(org_id)));

create policy "Editors can add loans" on public.loans
  for insert to authenticated
  with check (
    (select public.can_edit_org(org_id))
    and exists (select 1 from public.borrowers b where b.id = borrower_id and b.org_id = loans.org_id)
  );

create policy "Editors can edit loans" on public.loans
  for update to authenticated
  using ((select public.can_edit_org(org_id)))
  with check (
    (select public.can_edit_org(org_id))
    and exists (select 1 from public.borrowers b where b.id = borrower_id and b.org_id = loans.org_id)
  );

create policy "Owners can delete loans" on public.loans
  for delete to authenticated
  using ((select public.is_org_owner(org_id)));

-- Payments
create policy "Members can view payments" on public.payments
  for select to authenticated
  using ((select public.is_org_member(org_id)));

create policy "Editors can record payments" on public.payments
  for insert to authenticated
  with check (
    (select public.can_edit_org(org_id))
    and exists (select 1 from public.loans l where l.id = loan_id and l.org_id = payments.org_id)
  );

create policy "Owners, or editors for their own entries, can delete payments" on public.payments
  for delete to authenticated
  using (
    (select public.is_org_owner(org_id))
    or ((select public.can_edit_org(org_id)) and created_by = (select auth.uid()))
  );

-- Forgiving (or un-forgiving) a loan is an owner decision. Row policies can't
-- compare old and new values, so a trigger guards that column.
create function public.guard_loan_write_off()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.written_off_on is distinct from old.written_off_on and not public.is_org_owner(new.org_id) then
    raise exception 'Only organisation owners can forgive or reopen a loan';
  end if;
  return new;
end;
$$;

create trigger loans_guard_write_off
  before update of written_off_on on public.loans
  for each row execute function public.guard_loan_write_off();

-- Nobody but the database sets who created a row.
create function public.stamp_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by := auth.uid();
  return new;
end;
$$;

create trigger borrowers_stamp_created_by before insert on public.borrowers for each row execute function public.stamp_created_by();
create trigger loans_stamp_created_by before insert on public.loans for each row execute function public.stamp_created_by();
create trigger payments_stamp_created_by before insert on public.payments for each row execute function public.stamp_created_by();
