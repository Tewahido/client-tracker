-- Security fix: rows can't change organisation, and forgiving is owner-only on insert too.
--
-- Before this, a member of org A could create their own org B (becoming its owner),
-- move a loan into B, forgive or delete it there, and move it back: the write-off
-- guard checked the destination organisation. Pinning org_id closes that path.

create function public.prevent_org_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.org_id is distinct from old.org_id then
    raise exception 'Records cannot be moved to another organisation';
  end if;
  return new;
end;
$$;

create trigger borrowers_pin_org before update of org_id on public.borrowers
  for each row execute function public.prevent_org_change();
create trigger loans_pin_org before update of org_id on public.loans
  for each row execute function public.prevent_org_change();
create trigger payments_pin_org before update of org_id on public.payments
  for each row execute function public.prevent_org_change();

-- Check ownership of the organisation the row is (and stays) in, and also guard
-- inserts so a member can't create a loan that is already forgiven.
create or replace function public.guard_loan_write_off()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.written_off_on is not null and not public.is_org_owner(new.org_id) then
      raise exception 'Only organisation owners can forgive or reopen a loan';
    end if;
  elsif new.written_off_on is distinct from old.written_off_on and not public.is_org_owner(old.org_id) then
    raise exception 'Only organisation owners can forgive or reopen a loan';
  end if;
  return new;
end;
$$;

create trigger loans_guard_write_off_insert
  before insert on public.loans
  for each row execute function public.guard_loan_write_off();
