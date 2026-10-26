-- Security fix: who created a record can't be rewritten.
--
-- stamp_created_by sets created_by on insert, but the update policies let any editor
-- change it afterwards, falsifying the record of who added a person, loan or
-- organisation. (Payments can't be updated at all.) Changes cascading from elsewhere are
-- allowed: deleting a user account in Supabase clears created_by on what they added.

create function public.keep_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by and pg_trigger_depth() = 1 then
    raise exception 'Who created a record cannot be changed';
  end if;
  return new;
end;
$$;

create trigger borrowers_keep_created_by before update of created_by on public.borrowers
  for each row execute function public.keep_created_by();
create trigger loans_keep_created_by before update of created_by on public.loans
  for each row execute function public.keep_created_by();
create trigger organizations_keep_created_by before update of created_by on public.organizations
  for each row execute function public.keep_created_by();
