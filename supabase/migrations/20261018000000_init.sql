-- Lendly schema.
--
-- Organisations own all data. A user creates an organisation (becoming its
-- owner) and invites others by email; every member sees and edits the same
-- people, loans and payments. Row Level Security keeps organisations apart.

-------------------------------------------------------------------------------
-- Organisations, members and invites
-------------------------------------------------------------------------------

create type public.org_role as enum ('owner', 'member');

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) between 1 and 80),
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.organization_members (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  -- Copied from the user's verified login so members can see who else is in the org.
  email      text not null,
  role       public.org_role not null default 'member',
  joined_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table public.organization_invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  email       text not null check (email = lower(trim(email)) and email like '%_@_%'),
  role        public.org_role not null default 'member',
  invited_by  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (org_id, email)
);

create index organization_members_user_idx on public.organization_members (user_id);
create index organization_invites_email_idx on public.organization_invites (email);

-------------------------------------------------------------------------------
-- Ledger
-------------------------------------------------------------------------------

create table public.borrowers (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  name        text not null check (length(trim(name)) > 0),
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now()
);

create table public.loans (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations (id) on delete cascade,
  created_by       uuid default auth.uid() references auth.users (id) on delete set null,
  borrower_id      uuid not null references public.borrowers (id) on delete cascade,
  principal_cents  bigint not null check (principal_cents > 0),
  interest_rate    numeric(6, 2) not null default 0 check (interest_rate >= 0),
  lent_on          date not null default current_date,
  due_on           date not null,
  note             text,
  written_off_on   date,
  created_at       timestamptz not null default now()
);

create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  loan_id       uuid not null references public.loans (id) on delete cascade,
  amount_cents  bigint not null check (amount_cents > 0),
  paid_on       date not null default current_date,
  note          text,
  created_at    timestamptz not null default now()
);

create index borrowers_org_idx on public.borrowers (org_id);
create index loans_org_due_idx on public.loans (org_id, due_on);
create index loans_borrower_idx on public.loans (borrower_id);
create index payments_org_idx on public.payments (org_id);
create index payments_loan_idx on public.payments (loan_id);

-------------------------------------------------------------------------------
-- Helpers. SECURITY DEFINER so policies can check membership without
-- recursing through organization_members' own RLS.
-------------------------------------------------------------------------------

create function public.current_email()
returns text
language sql
stable
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create function public.is_org_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org and m.user_id = auth.uid()
  );
$$;

create function public.is_org_owner(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

-------------------------------------------------------------------------------
-- RPCs for actions that touch several tables or need extra rules
-------------------------------------------------------------------------------

/* Create an organisation and make the caller its owner, atomically. */
create function public.create_organization(p_name text)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  org public.organizations;
begin
  if auth.uid() is null then
    raise exception 'You need to be signed in';
  end if;

  insert into public.organizations (name, created_by)
  values (trim(p_name), auth.uid())
  returning * into org;

  insert into public.organization_members (org_id, user_id, email, role)
  values (org.id, auth.uid(), public.current_email(), 'owner');

  return org;
end;
$$;

/* Accept an invite addressed to the caller's email. Returns the organisation id. */
create function public.accept_invite(p_invite uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.organization_invites;
begin
  select * into inv
  from public.organization_invites
  where id = p_invite and email = public.current_email();

  if not found then
    raise exception 'This invite does not exist or is for a different email address';
  end if;

  insert into public.organization_members (org_id, user_id, email, role)
  values (inv.org_id, auth.uid(), public.current_email(), inv.role)
  on conflict (org_id, user_id) do nothing;

  delete from public.organization_invites where id = inv.id;
  return inv.org_id;
end;
$$;

/* Leave an organisation. The last owner must hand over ownership first; the last member deletes it. */
create function public.leave_organization(p_org uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  my_role public.org_role;
  members int;
  owners int;
begin
  select role into my_role
  from public.organization_members
  where org_id = p_org and user_id = auth.uid();

  if not found then
    raise exception 'You are not a member of this organisation';
  end if;

  select count(*), count(*) filter (where role = 'owner')
  into members, owners
  from public.organization_members
  where org_id = p_org;

  if members = 1 then
    delete from public.organizations where id = p_org;
    return;
  end if;

  if my_role = 'owner' and owners = 1 then
    raise exception 'Make another member an owner before leaving';
  end if;

  delete from public.organization_members where org_id = p_org and user_id = auth.uid();
end;
$$;

revoke execute on function public.is_org_member(uuid), public.is_org_owner(uuid),
  public.create_organization(text), public.accept_invite(uuid), public.leave_organization(uuid)
  from public, anon;
grant execute on function public.is_org_member(uuid), public.is_org_owner(uuid),
  public.create_organization(text), public.accept_invite(uuid), public.leave_organization(uuid)
  to authenticated;

-------------------------------------------------------------------------------
-- Row Level Security
-------------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;
alter table public.borrowers enable row level security;
alter table public.loans enable row level security;
alter table public.payments enable row level security;

-- Organisations: visible to members and to people invited to them (so the invite can show its name).
create policy "Members and invitees can view" on public.organizations
  for select to authenticated
  using (
    (select public.is_org_member(id))
    or exists (
      select 1 from public.organization_invites i
      -- Qualified: a bare `id` here would resolve to the invite's own id.
      where i.org_id = organizations.id and i.email = (select public.current_email())
    )
  );

create policy "Owners can rename" on public.organizations
  for update to authenticated
  using ((select public.is_org_owner(id)))
  with check ((select public.is_org_owner(id)));

create policy "Owners can delete" on public.organizations
  for delete to authenticated
  using ((select public.is_org_owner(id)));
-- Inserts happen only through create_organization().

-- Members: visible to fellow members; owners change roles and remove others. Joining/leaving use RPCs.
create policy "Members can view each other" on public.organization_members
  for select to authenticated
  using ((select public.is_org_member(org_id)));

create policy "Owners can change roles" on public.organization_members
  for update to authenticated
  using ((select public.is_org_owner(org_id)))
  with check ((select public.is_org_owner(org_id)));

create policy "Owners can remove others" on public.organization_members
  for delete to authenticated
  using ((select public.is_org_owner(org_id)) and user_id <> (select auth.uid()));

-- Invites: members see their org's invites, invitees see their own; owners send and revoke, invitees decline.
create policy "Members and invitees can view" on public.organization_invites
  for select to authenticated
  using ((select public.is_org_member(org_id)) or email = (select public.current_email()));

create policy "Owners can invite" on public.organization_invites
  for insert to authenticated
  with check ((select public.is_org_owner(org_id)));

create policy "Owners revoke, invitees decline" on public.organization_invites
  for delete to authenticated
  using ((select public.is_org_owner(org_id)) or email = (select public.current_email()));

-- Ledger: shared by every member of the owning organisation.
create policy "Members share borrowers" on public.borrowers
  for all to authenticated
  using ((select public.is_org_member(org_id)))
  with check ((select public.is_org_member(org_id)));

create policy "Members share loans" on public.loans
  for all to authenticated
  using ((select public.is_org_member(org_id)))
  with check (
    (select public.is_org_member(org_id))
    and exists (select 1 from public.borrowers b where b.id = borrower_id and b.org_id = loans.org_id)
  );

create policy "Members share payments" on public.payments
  for all to authenticated
  using ((select public.is_org_member(org_id)))
  with check (
    (select public.is_org_member(org_id))
    and exists (select 1 from public.loans l where l.id = loan_id and l.org_id = payments.org_id)
  );

-------------------------------------------------------------------------------
-- Realtime: members see each other's changes live.
-------------------------------------------------------------------------------

alter publication supabase_realtime add table public.borrowers, public.loans, public.payments;
