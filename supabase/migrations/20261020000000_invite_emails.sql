-- Invite emails.
--
-- The send-invite Edge Function emails invitees. It first calls claim_invite_email with
-- the caller's own token, so the database decides whether an email may go out:
--
--   * only owners of the invite's organisation may send it;
--   * each address gets at most 1 invite email per 10 minutes and 3 per day, from anyone
--     (so no inbox can be flooded);
--   * each person sends at most 20 invite emails per day, across all their organisations
--     (so the project can't be used to mail many addresses).
--
-- Limits are counted in an append-only log that deleting or re-creating invites (or
-- organisations) cannot reset. Advisory locks serialise claims per sender and per
-- address, so parallel requests can't slip past a limit.

alter table public.organization_invites add column emailed_at timestamptz;

create table public.invite_email_log (
  id         bigint generated always as identity primary key,
  sender     uuid not null,
  recipient  text not null,
  org_id     uuid not null,
  sent_at    timestamptz not null default now()
);

create index invite_email_log_sender_idx on public.invite_email_log (sender, sent_at);
create index invite_email_log_recipient_idx on public.invite_email_log (recipient, sent_at);

-- Only claim_invite_email (security definer) touches the log; clients can't read or change it.
alter table public.invite_email_log enable row level security;
revoke all on public.invite_email_log from public, anon, authenticated;

create function public.claim_invite_email(p_invite uuid)
returns table (invite_email text, org_name text, inviter_email text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_email text;
  v_sender uuid := auth.uid();
begin
  select i.org_id, i.email into v_org, v_email from public.organization_invites i where i.id = p_invite;
  if v_org is null or not public.is_org_owner(v_org) then
    raise exception 'Only owners can email this invite' using errcode = '42501';
  end if;

  -- Always sender first, then recipient, so two claims can't deadlock.
  perform pg_advisory_xact_lock(hashtext('invite-email-sender:' || v_sender::text));
  perform pg_advisory_xact_lock(hashtext('invite-email-recipient:' || v_email));

  if exists (select 1 from public.invite_email_log l where l.recipient = v_email and l.sent_at > now() - interval '10 minutes')
     or (select count(*) from public.invite_email_log l where l.recipient = v_email and l.sent_at > now() - interval '1 day') >= 3 then
    raise exception 'This address was sent an invite recently' using errcode = 'P0001';
  end if;

  if (select count(*) from public.invite_email_log l where l.sender = v_sender and l.sent_at > now() - interval '1 day') >= 20 then
    raise exception 'Daily invite email limit reached' using errcode = 'P0001';
  end if;

  insert into public.invite_email_log (sender, recipient, org_id) values (v_sender, v_email, v_org);
  update public.organization_invites i set emailed_at = now() where i.id = p_invite;

  return query
    select v_email, o.name, public.current_email() from public.organizations o where o.id = v_org;
end;
$$;

revoke execute on function public.claim_invite_email(uuid) from public, anon;
grant execute on function public.claim_invite_email(uuid) to authenticated;
