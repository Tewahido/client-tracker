-- Release an invite-email claim when the email could not be sent.
--
-- claim_invite_email logs a send before the email goes out, so the limits hold even under
-- parallel requests. If the mail provider then fails (e.g. SMTP misconfigured), that log
-- entry shouldn't count against the address's 10-minute / daily limit or the sender's
-- daily limit. The send-invite function calls this after a failed send.
--
-- Only the service role (the Edge Function) may call it: owners can't, or they could
-- release successful sends and bypass the limits.

create function public.release_invite_email(p_invite uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_email text;
begin
  select i.org_id, i.email into v_org, v_email from public.organization_invites i where i.id = p_invite;
  if v_org is null then
    return;
  end if;

  -- Only the claim that was just made: the newest entry for this address and organisation.
  delete from public.invite_email_log
  where id = (
    select l.id from public.invite_email_log l
    where l.recipient = v_email and l.org_id = v_org and l.sent_at > now() - interval '5 minutes'
    order by l.sent_at desc, l.id desc
    limit 1
  );

  update public.organization_invites i set emailed_at = null where i.id = p_invite;
end;
$$;

revoke execute on function public.release_invite_email(uuid) from public, anon, authenticated;
grant execute on function public.release_invite_email(uuid) to service_role;
