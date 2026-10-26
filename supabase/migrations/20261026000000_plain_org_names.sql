-- Security fix: invite emails can't be turned into phishing mail.
--
-- Anyone can sign up, name an organisation and have Lendly email invites from this
-- project's address with that name in them. So:
--   * organisation names may not contain links, web addresses or markup;
--   * invites aren't emailed for an organisation whose (older) name breaks that rule;
--   * the whole project sends at most 200 invite emails a day, however many accounts
--     someone creates (each person was already limited to 20).

/* True when a name has no link, web address or markup a mail client could turn into a link. */
create function public.is_plain_org_name(p_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_name !~ '[<>]'
     and p_name !~* '(://|www\.)'
     -- Something that looks like a domain, e.g. "pay-here.com" or "bank.co.za".
     and p_name !~* '\m[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|net|org|info|biz|io|co|app|dev|xyz|online|site|link|me|ly|za|uk|us|ru|cn|top|click|shop|live|support|help|bank|pay|money)\M';
$$;

-- NOT VALID: names saved before this check are left alone (claim_invite_email refuses to
-- email for them below); every new organisation and every rename is checked.
alter table public.organizations
  add constraint organizations_name_plain check (public.is_plain_org_name(name)) not valid;

create or replace function public.claim_invite_email(p_invite uuid)
returns table (invite_email text, org_name text, inviter_email text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_email text;
  v_name text;
  v_sender uuid := auth.uid();
begin
  select i.org_id, i.email into v_org, v_email from public.organization_invites i where i.id = p_invite;
  if v_org is null or not public.is_org_owner(v_org) then
    raise exception 'Only owners can email this invite' using errcode = '42501';
  end if;

  select o.name into v_name from public.organizations o where o.id = v_org;
  if not public.is_plain_org_name(v_name) then
    raise exception 'Rename the organisation without links or web addresses before emailing invites' using errcode = '42501';
  end if;

  -- Global first, then sender, then recipient, so two claims can't deadlock.
  perform pg_advisory_xact_lock(hashtext('invite-email-global'));
  perform pg_advisory_xact_lock(hashtext('invite-email-sender:' || v_sender::text));
  perform pg_advisory_xact_lock(hashtext('invite-email-recipient:' || v_email));

  if (select count(*) from public.invite_email_log l where l.sent_at > now() - interval '1 day') >= 200 then
    raise exception 'Lendly has sent its daily invite emails. Share the invite yourself, or try again tomorrow' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.invite_email_log l where l.recipient = v_email and l.sent_at > now() - interval '10 minutes')
     or (select count(*) from public.invite_email_log l where l.recipient = v_email and l.sent_at > now() - interval '1 day') >= 3 then
    raise exception 'This address was sent an invite recently' using errcode = 'P0001';
  end if;

  if (select count(*) from public.invite_email_log l where l.sender = v_sender and l.sent_at > now() - interval '1 day') >= 20 then
    raise exception 'Daily invite email limit reached' using errcode = 'P0001';
  end if;

  insert into public.invite_email_log (sender, recipient, org_id) values (v_sender, v_email, v_org);
  update public.organization_invites i set emailed_at = now() where i.id = p_invite;

  return query select v_email, v_name, public.current_email();
end;
$$;

create index invite_email_log_sent_at_idx on public.invite_email_log (sent_at);
