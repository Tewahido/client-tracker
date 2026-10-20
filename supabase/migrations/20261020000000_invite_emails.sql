-- Invite emails.
--
-- The send-invite Edge Function emails invitees. It calls claim_invite_email with the
-- caller's own token first, so the database decides who may send: only owners of the
-- invite's organisation, at most once every 10 minutes per invite (so one inbox can't be
-- flooded) and at most 20 per organisation per day (so the project can't be used to
-- spam many addresses). Only then does the function send the email.

alter table public.organization_invites add column emailed_at timestamptz;

create function public.claim_invite_email(p_invite uuid)
returns table (invite_email text, org_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select i.org_id into v_org from public.organization_invites i where i.id = p_invite;
  if v_org is null or not public.is_org_owner(v_org) then
    raise exception 'Only owners can email this invite' using errcode = '42501';
  end if;

  if (select count(*) from public.organization_invites i
      where i.org_id = v_org and i.emailed_at > now() - interval '1 day') >= 20 then
    raise exception 'Daily invite email limit reached' using errcode = 'P0001';
  end if;

  return query
    update public.organization_invites i
    set emailed_at = now()
    where i.id = p_invite and (i.emailed_at is null or i.emailed_at < now() - interval '10 minutes')
    returning i.email, (select o.name from public.organizations o where o.id = i.org_id);

  if not found then
    raise exception 'This invite was emailed a few minutes ago' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.claim_invite_email(uuid) from public, anon;
grant execute on function public.claim_invite_email(uuid) to authenticated;
