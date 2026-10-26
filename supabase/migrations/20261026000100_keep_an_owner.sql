-- Security fix: an organisation always keeps at least one owner.
--
-- The last owner could change their own role to member or viewer, leaving nobody able to
-- invite, rename, restore or delete the organisation. Now stepping down (or being removed)
-- as an owner needs another owner to remain. Changes that cascade from elsewhere are left
-- alone: deleting the organisation removes everyone (leave_organization does this for the
-- last member), and deleting a user account in Supabase removes their memberships, even
-- if that leaves an organisation without an owner.

create function public.keep_an_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role <> 'owner' or (tg_op = 'UPDATE' and new.role = 'owner') or pg_trigger_depth() > 1 then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  -- Lock the organisation so two owners stepping down at once can't both succeed (NO KEY:
  -- ledger inserts referencing the organisation needn't wait). No row means the
  -- organisation itself is being deleted: nothing to keep.
  perform 1 from public.organizations o where o.id = old.org_id for no key update;
  if found and not exists (
    select 1 from public.organization_members m
    where m.org_id = old.org_id and m.role = 'owner' and m.user_id <> old.user_id
  ) then
    raise exception 'An organisation needs at least one owner. Make someone else an owner first.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger organization_members_keep_an_owner
  before update of role or delete on public.organization_members
  for each row execute function public.keep_an_owner();
