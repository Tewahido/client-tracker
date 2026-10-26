/**
 * Runs the real migration in PGlite (Postgres compiled to WASM) with small stubs
 * for Supabase's `auth` schema, then exercises Row Level Security as different
 * users. Catches policy mistakes without needing a Supabase project.
 */
import { PGlite } from '@electric-sql/pglite'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ACCEPTED_ORG_NAMES, REFUSED_ORG_NAMES } from '../../src/lib/orgName.cases'

const MIGRATIONS = join(__dirname, '..', 'migrations')

const SUPABASE_STUBS = `
  create role authenticated nologin;
  create role anon nologin;
  create role service_role nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text not null);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;
  create publication supabase_realtime;
  grant usage on schema public, auth to authenticated, anon;
  -- Like Supabase: both API roles get table privileges by default; RLS and grants decide the rest.
  alter default privileges in schema public grant all on tables to authenticated, anon;
`

const users = {
  alice: { id: '00000000-0000-0000-0000-00000000000a', email: 'alice@example.com' },
  bob: { id: '00000000-0000-0000-0000-00000000000b', email: 'bob@example.com' },
  carol: { id: '00000000-0000-0000-0000-00000000000c', email: 'carol@example.com' },
}
type User = keyof typeof users

let db: PGlite

/** Run SQL as a signed-in user, with RLS enforced. */
async function as<T = Record<string, unknown>>(user: User, sql: string, params: unknown[] = []): Promise<T[]> {
  const { id, email } = users[user]
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)`, [
      id,
      JSON.stringify({ sub: id, email }),
    ])
    await tx.exec('set local role authenticated')
    const result = await tx.query<T>(sql, params)
    return result.rows
  })
}

async function createOrg(user: User, name: string): Promise<string> {
  const [org] = await as<{ id: string }>(user, 'select id from public.create_organization($1)', [name])
  return org.id
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STUBS)
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(MIGRATIONS, file), 'utf8'))
  }
  for (const u of Object.values(users)) await db.query('insert into auth.users (id, email) values ($1, $2)', [u.id, u.email])
})

describe('organisations', () => {
  let orgA: string
  let borrowerA: string

  it('makes the creator the owner', async () => {
    orgA = await createOrg('alice', 'Alice & Co')
    const members = await as<{ role: string; email: string }>('alice', 'select role, email from organization_members where org_id = $1', [orgA])
    expect(members).toEqual([{ role: 'owner', email: 'alice@example.com' }])
  })

  it('lets members write and hides the data from everyone else', async () => {
    const [b] = await as<{ id: string }>('alice', "insert into borrowers (org_id, name) values ($1, 'Sipho') returning id", [orgA])
    borrowerA = b.id
    await as('alice', "insert into loans (org_id, borrower_id, principal_cents, due_on) values ($1, $2, 10000, '2026-12-01')", [orgA, borrowerA])

    expect(await as('bob', 'select * from borrowers')).toHaveLength(0)
    expect(await as('bob', 'select * from organizations')).toHaveLength(0)
    await expect(as('bob', "insert into borrowers (org_id, name) values ($1, 'Intruder')", [orgA])).rejects.toThrow(/row-level security/)
  })

  it('does not let organisations be created by direct insert', async () => {
    await expect(as('carol', "insert into organizations (name) values ('Sneaky')")).rejects.toThrow(/row-level security/)
  })

  it('shares the ledger once an invite is accepted', async () => {
    const [invite] = await as<{ id: string }>('alice', "insert into organization_invites (org_id, email) values ($1, 'bob@example.com') returning id", [orgA])

    // Bob sees his invite and the organisation's name before joining, but not its data.
    expect(await as('bob', 'select id from organization_invites')).toHaveLength(1)
    expect(await as<{ name: string }>('bob', 'select name from organizations')).toEqual([{ name: 'Alice & Co' }])
    expect(await as('bob', 'select * from borrowers')).toHaveLength(0)

    // Carol can't accept Bob's invite.
    await expect(as('carol', 'select public.accept_invite($1)', [invite.id])).rejects.toThrow(/different email/)

    await as('bob', 'select public.accept_invite($1)', [invite.id])
    expect(await as('bob', 'select * from borrowers')).toHaveLength(1)
    expect(await as('bob', 'select * from loans')).toHaveLength(1)
    expect(await as('alice', 'select * from organization_invites')).toHaveLength(0)
  })

  it('reserves member management for owners', async () => {
    await expect(as('bob', "insert into organization_invites (org_id, email) values ($1, 'carol@example.com')", [orgA])).rejects.toThrow(
      /row-level security/,
    )
    // Bob's attempt to promote himself silently matches no rows.
    await as('bob', "update organization_members set role = 'owner' where org_id = $1", [orgA])
    const roles = await as<{ email: string; role: string }>('alice', 'select email, role from organization_members where org_id = $1 order by email', [orgA])
    expect(roles.map((r) => r.role)).toEqual(['owner', 'member'])
  })

  it('rejects loans that point at another organisation’s borrower', async () => {
    const orgC = await createOrg('carol', 'Carol Lends')
    await expect(
      as('carol', "insert into loans (org_id, borrower_id, principal_cents, due_on) values ($1, $2, 500, '2026-12-01')", [orgC, borrowerA]),
    ).rejects.toThrow(/row-level security/)
  })

  it('keeps an owner until ownership is handed over, and removes empty organisations', async () => {
    await expect(as('alice', 'select public.leave_organization($1)', [orgA])).rejects.toThrow(/another member an owner/)

    await as('bob', 'select public.leave_organization($1)', [orgA])
    expect(await as('bob', 'select * from borrowers')).toHaveLength(0)

    await as('alice', 'select public.leave_organization($1)', [orgA])
    expect(await db.query('select * from organizations where id = $1', [orgA]).then((r) => r.rows)).toHaveLength(0)
    expect(await db.query('select * from borrowers where org_id = $1', [orgA]).then((r) => r.rows)).toHaveLength(0)
  })
})

describe('roles and permissions', () => {
  let org: string
  let borrower: string
  let loan: string

  /** Invite `user` to `org` with `role` and accept on their behalf. */
  async function join(user: User, role: 'member' | 'viewer') {
    const [invite] = await as<{ id: string }>('alice', 'insert into organization_invites (org_id, email, role) values ($1, $2, $3) returning id', [
      org,
      users[user].email,
      role,
    ])
    await as(user, 'select public.accept_invite($1)', [invite.id])
  }

  beforeAll(async () => {
    org = await createOrg('alice', 'Permissions Co')
    await join('bob', 'member')
    await join('carol', 'viewer')
    ;[{ id: borrower }] = await as<{ id: string }>('alice', "insert into borrowers (org_id, name) values ($1, 'Thandi') returning id", [org])
    ;[{ id: loan }] = await as<{ id: string }>('alice', "insert into loans (org_id, borrower_id, principal_cents, due_on) values ($1, $2, 9000, '2026-12-01') returning id", [org, borrower])
  })

  it('lets viewers read but not write', async () => {
    expect(await as('carol', 'select * from loans where org_id = $1', [org])).toHaveLength(1)
    await expect(as('carol', "insert into borrowers (org_id, name) values ($1, 'Nope')", [org])).rejects.toThrow(/row-level security/)
    await expect(as('carol', 'insert into payments (org_id, loan_id, amount_cents) values ($1, $2, 100)', [org, loan])).rejects.toThrow(/row-level security/)
    const updated = await as('carol', "update loans set note = 'hacked' where id = $1 returning id", [loan])
    expect(updated).toHaveLength(0)
  })

  it('lets members add and edit but not delete people or loans', async () => {
    await as('bob', "update loans set note = 'Car repair' where id = $1", [loan])
    await as('bob', "insert into borrowers (org_id, name) values ($1, 'Bob added')", [org])

    expect(await as('bob', 'delete from loans where id = $1 returning id', [loan])).toHaveLength(0)
    expect(await as('bob', 'delete from borrowers where id = $1 returning id', [borrower])).toHaveLength(0)
  })

  it('reserves forgiving a loan for owners', async () => {
    await expect(as('bob', "update loans set written_off_on = '2026-10-18' where id = $1", [loan])).rejects.toThrow(/Only organisation owners/)
    await as('alice', "update loans set written_off_on = '2026-10-18' where id = $1", [loan])
    await as('alice', 'update loans set written_off_on = null where id = $1', [loan])
  })

  it('lets members remove only the payments they recorded', async () => {
    const [mine] = await as<{ id: string; created_by: string }>('bob', 'insert into payments (org_id, loan_id, amount_cents) values ($1, $2, 1000) returning id, created_by', [org, loan])
    expect(mine.created_by).toBe(users.bob.id)
    const [alices] = await as<{ id: string }>('alice', 'insert into payments (org_id, loan_id, amount_cents) values ($1, $2, 2000) returning id', [org, loan])

    expect(await as('bob', 'delete from payments where id = $1 returning id', [alices.id])).toHaveLength(0)
    expect(await as('bob', 'delete from payments where id = $1 returning id', [mine.id])).toHaveLength(1)
  })

  it('stamps created_by itself so it cannot be spoofed', async () => {
    const [row] = await as<{ created_by: string }>('bob', 'insert into payments (org_id, loan_id, amount_cents, created_by) values ($1, $2, 500, $3) returning created_by', [
      org,
      loan,
      users.alice.id,
    ])
    expect(row.created_by).toBe(users.bob.id)
  })

  it('lets owners delete anything', async () => {
    expect(await as('alice', 'delete from borrowers where id = $1 returning id', [borrower])).toHaveLength(1)
    expect(await as('alice', 'select * from loans where id = $1', [loan])).toHaveLength(0)
  })
})

describe('organisation defaults', () => {
  it('starts with sensible defaults that only owners can change', async () => {
    const org = await createOrg('alice', 'Defaults Co')
    const [invite] = await as<{ id: string }>('alice', "insert into organization_invites (org_id, email) values ($1, 'bob@example.com') returning id", [org])
    await as('bob', 'select public.accept_invite($1)', [invite.id])

    const [row] = await as<{ currency: string; default_term_days: number; default_interest_rate: string }>(
      'bob',
      'select currency, default_term_days, default_interest_rate from organizations where id = $1',
      [org],
    )
    expect(row).toEqual({ currency: 'ZAR', default_term_days: 30, default_interest_rate: '0.00' })

    expect(await as('bob', 'update organizations set default_term_days = 7 where id = $1 returning id', [org])).toHaveLength(0)
    await as('alice', "update organizations set default_term_days = 14, default_interest_rate = 10, currency = 'BWP' where id = $1", [org])
    await expect(as('alice', "update organizations set currency = 'rand' where id = $1", [org])).rejects.toThrow(/check constraint/)
  })
})

describe('row ownership (security fix)', () => {
  let orgA: string
  let orgB: string
  let borrower: string
  let loan: string

  beforeAll(async () => {
    orgA = await createOrg('alice', 'Org A')
    const [invite] = await as<{ id: string }>('alice', "insert into organization_invites (org_id, email) values ($1, 'bob@example.com') returning id", [orgA])
    await as('bob', 'select public.accept_invite($1)', [invite.id])
    orgB = await createOrg('bob', 'Bob owns this')
    ;[{ id: borrower }] = await as<{ id: string }>('alice', "insert into borrowers (org_id, name) values ($1, 'Target') returning id", [orgA])
    ;[{ id: loan }] = await as<{ id: string }>('alice', "insert into loans (org_id, borrower_id, principal_cents, due_on) values ($1, $2, 5000, '2026-12-01') returning id", [orgA, borrower])
  })

  it('stops a member moving rows into an organisation they own', async () => {
    await expect(as('bob', 'update borrowers set org_id = $1 where id = $2', [orgB, borrower])).rejects.toThrow(/cannot be moved/)
    await expect(as('bob', 'update loans set org_id = $1 where id = $2', [orgB, loan])).rejects.toThrow(/cannot be moved/)
    await expect(
      as('bob', "update loans set org_id = $1, written_off_on = '2026-10-18' where id = $2", [orgB, loan]),
    ).rejects.toThrow(/cannot be moved|Only organisation owners/)
    const [row] = await as<{ org_id: string; written_off_on: string | null }>('alice', 'select org_id, written_off_on from loans where id = $1', [loan])
    expect(row).toEqual({ org_id: orgA, written_off_on: null })
  })

  it('stops even owners moving rows between their organisations', async () => {
    const orgC = await createOrg('alice', 'Org C')
    await expect(as('alice', 'update borrowers set org_id = $1 where id = $2', [orgC, borrower])).rejects.toThrow(/cannot be moved/)
  })

  it('stops a member inserting a loan that is already forgiven', async () => {
    await expect(
      as('bob', "insert into loans (org_id, borrower_id, principal_cents, due_on, written_off_on) values ($1, $2, 100, '2026-12-01', '2026-10-18')", [orgA, borrower]),
    ).rejects.toThrow(/Only organisation owners/)
    await as('alice', "insert into loans (org_id, borrower_id, principal_cents, due_on, written_off_on) values ($1, $2, 100, '2026-12-01', '2026-10-18')", [orgA, borrower])
  })
})

describe('member rows (security fix)', () => {
  it('lets owners change roles but not identity columns', async () => {
    const org = await createOrg('alice', 'Identity Co')
    const [invite] = await as<{ id: string }>('alice', "insert into organization_invites (org_id, email) values ($1, 'bob@example.com') returning id", [org])
    await as('bob', 'select public.accept_invite($1)', [invite.id])

    await as('alice', "update organization_members set role = 'viewer' where org_id = $1 and user_id = $2", [org, users.bob.id])
    await expect(
      as('alice', "update organization_members set email = 'ceo@bank.com' where org_id = $1 and user_id = $2", [org, users.bob.id]),
    ).rejects.toThrow(/permission denied/)
    await expect(
      as('alice', 'update organization_members set user_id = $1 where org_id = $2 and user_id = $3', [users.carol.id, org, users.bob.id]),
    ).rejects.toThrow(/permission denied/)

    const rows = await as<{ email: string; role: string }>('alice', 'select email, role from organization_members where org_id = $1 order by email', [org])
    expect(rows).toEqual([
      { email: 'alice@example.com', role: 'owner' },
      { email: 'bob@example.com', role: 'viewer' },
    ])
  })
})

describe('restore_snapshot', () => {
  let org: string
  const ids = {
    borrower: '10000000-0000-0000-0000-000000000001',
    loan: '20000000-0000-0000-0000-000000000001',
    payment: '30000000-0000-0000-0000-000000000001',
  }
  const backup = (amountCents: number) => [
    org,
    JSON.stringify([{ id: ids.borrower, name: 'Restored person' }]),
    JSON.stringify([{ id: ids.loan, borrower_id: ids.borrower, principal_cents: 10000, lent_on: '2026-10-01', due_on: '2026-11-01' }]),
    JSON.stringify([{ id: ids.payment, loan_id: ids.loan, amount_cents: amountCents, paid_on: '2026-10-10' }]),
  ]
  const restore = (user: User, amountCents: number) =>
    as(user, 'select public.restore_snapshot($1, $2::jsonb, $3::jsonb, $4::jsonb)', backup(amountCents))
  const names = () => as<{ name: string }>('alice', 'select name from borrowers where org_id = $1 order by name', [org])

  beforeAll(async () => {
    org = await createOrg('alice', 'Restore Co')
    await as('alice', "insert into borrowers (org_id, name) values ($1, 'Original person')", [org])
    const [invite] = await as<{ id: string }>('alice', "insert into organization_invites (org_id, email) values ($1, 'bob@example.com') returning id", [org])
    await as('bob', 'select public.accept_invite($1)', [invite.id])
  })

  it('changes nothing when any part of the backup is rejected', async () => {
    await expect(restore('alice', 0)).rejects.toThrow(/check constraint/)
    expect(await names()).toEqual([{ name: 'Original person' }])
  })

  it('is reserved for owners', async () => {
    await expect(restore('bob', 500)).rejects.toThrow(/Only organisation owners/)
    expect(await names()).toEqual([{ name: 'Original person' }])
  })

  it('replaces the ledger in one go for owners', async () => {
    await restore('alice', 500)
    expect(await names()).toEqual([{ name: 'Restored person' }])
    const [payment] = await as<{ amount_cents: number; org_id: string }>('alice', 'select amount_cents, org_id from payments where id = $1', [ids.payment])
    expect(payment).toEqual({ amount_cents: 500, org_id: org })
  })

  it('restores monthly repayment plans', async () => {
    const plan = { instalment_count: 12, first_due_on: '2026-11-01', due_on: '2027-10-01', total_due_cents: 2_400_000 }
    await as('alice', 'select public.restore_snapshot($1, $2::jsonb, $3::jsonb, $4::jsonb)', [
      org,
      JSON.stringify([{ id: ids.borrower, name: 'Restored person' }]),
      JSON.stringify([{ id: ids.loan, borrower_id: ids.borrower, principal_cents: 2_000_000, interest_rate: 20, lent_on: '2026-10-01', ...plan }]),
      '[]',
    ])
    const [loan] = await as('alice', 'select instalment_count, first_due_on::text, due_on::text, total_due_cents from loans where id = $1', [ids.loan])
    expect(loan).toEqual({ ...plan, total_due_cents: 2_400_000 })
  })
})

describe('instalment loans', () => {
  let org: string
  let borrower: string

  /** Insert a loan as Bob (a member), with only the given plan columns set. */
  const insert = (plan: string) =>
    as<{ id: string }>(
      'bob',
      `insert into loans (org_id, borrower_id, principal_cents, lent_on, due_on, instalment_count, first_due_on, total_due_cents)
       values ($1, $2, 2000000, '2026-10-01', ${plan}) returning id`,
      [org, borrower],
    )

  beforeAll(async () => {
    org = await createOrg('alice', 'Instalments Co')
    const [invite] = await as<{ id: string }>('alice', "insert into organization_invites (org_id, email) values ($1, 'bob@example.com') returning id", [org])
    await as('bob', 'select public.accept_invite($1)', [invite.id])
    ;[{ id: borrower }] = await as<{ id: string }>('alice', "insert into borrowers (org_id, name) values ($1, 'Naledi') returning id", [org])
  })

  it('lets members record a monthly plan whose last payment matches the due date', async () => {
    expect(await insert("'2027-10-01', 12, '2026-11-01', 2400000")).toHaveLength(1)
    // Month ends clamp like the app's date maths: 31 Jan + 1 month is 28 Feb.
    expect(await insert("'2027-02-28', 2, '2027-01-31', 2400000")).toHaveLength(1)
  })

  it('keeps once-off loans working without a plan', async () => {
    expect(await insert("'2026-11-01', null, null, null")).toHaveLength(1)
  })

  it.each([
    ['a due date that is not the last instalment', "'2027-09-01', 12, '2026-11-01', 2400000"],
    ['a plan without a total', "'2027-10-01', 12, '2026-11-01', null"],
    ['a plan without a first payment date', "'2027-10-01', 12, null, 2400000"],
    ['a first payment before the money was lent', "'2027-08-15', 12, '2026-09-15', 2400000"],
    ['a single instalment', "'2026-11-01', 1, '2026-11-01', 2400000"],
    ['more than 30 years of instalments', "'2056-11-01', 361, '2026-11-01', 2400000"],
    ['less than a cent per instalment', "'2027-10-01', 12, '2026-11-01', 11"],
    ['a first payment date without a count', "'2026-11-01', null, '2026-11-01', null"],
    ['an agreed total on a once-off loan', "'2026-11-01', null, null, 100"],
  ])('rejects %s', async (_label, plan) => {
    await expect(insert(plan)).rejects.toThrow(/check constraint/)
  })

  it('checks the plan again when a loan is edited', async () => {
    const [{ id }] = await insert("'2027-10-01', 12, '2026-11-01', 2400000")
    await expect(as('bob', 'update loans set instalment_count = 6 where id = $1', [id])).rejects.toThrow(/check constraint/)
    await as('bob', "update loans set instalment_count = 6, due_on = '2027-04-01' where id = $1", [id])
  })
})

describe('claim_invite_email', () => {
  let org: string

  const invite = async (email: string, inOrg = org) => {
    const [i] = await as<{ id: string }>('alice', 'insert into organization_invites (org_id, email) values ($1, $2) returning id', [inOrg, email])
    return i.id
  }
  const claim = (user: User, inviteId: string) =>
    as<{ invite_email: string; org_name: string; inviter_email: string }>(user, 'select * from public.claim_invite_email($1)', [inviteId])
  /** Pretend every email so far was sent this long ago. */
  const age = (interval: string) => db.query(`update invite_email_log set sent_at = sent_at - $1::interval`, [interval])

  beforeAll(async () => {
    org = await createOrg('alice', 'Invite Mailers')
  })

  beforeEach(async () => {
    await db.query('delete from invite_email_log')
    await db.query('delete from organization_invites where org_id = $1', [org])
  })

  it('refuses anyone but an owner of the invite’s organisation', async () => {
    const id = await invite('carol@example.com')
    await expect(claim('bob', id)).rejects.toThrow(/Only owners/)
    // Carol is the invitee: she can see the invite, but can't make Lendly email it.
    await expect(claim('carol', id)).rejects.toThrow(/Only owners/)
  })

  it('gives an owner the address, organisation and their own email', async () => {
    const id = await invite('carol@example.com')
    expect(await claim('alice', id)).toEqual([{ invite_email: 'carol@example.com', org_name: 'Invite Mailers', inviter_email: 'alice@example.com' }])
  })

  it('emails an address at most once per 10 minutes, even if the invite is deleted and re-created', async () => {
    await claim('alice', await invite('carol@example.com'))
    await as('alice', 'delete from organization_invites where org_id = $1', [org])
    await expect(claim('alice', await invite('carol@example.com'))).rejects.toThrow(/sent an invite recently/)

    // …or re-created in another organisation.
    const other = await createOrg('alice', 'Second Org')
    await expect(claim('alice', await invite('carol@example.com', other))).rejects.toThrow(/sent an invite recently/)
  })

  it('emails an address at most 3 times a day', async () => {
    const id = await invite('carol@example.com')
    for (let n = 0; n < 3; n++) {
      await claim('alice', id)
      await age('11 minutes')
    }
    await expect(claim('alice', id)).rejects.toThrow(/sent an invite recently/)
    await age('1 day')
    expect(await claim('alice', id)).toHaveLength(1)
  })

  it('lets one person send at most 20 invite emails a day, across organisations', async () => {
    await db.query(
      `insert into invite_email_log (sender, recipient, org_id)
       select $1, 'bulk' || n || '@example.com', gen_random_uuid() from generate_series(1, 20) n`,
      [users.alice.id],
    )
    await expect(claim('alice', await invite('fresh@example.com'))).rejects.toThrow(/Daily invite email limit/)
  })

  it('lets the function release a claim whose email failed, so it does not count', async () => {
    const id = await invite('carol@example.com')
    await claim('alice', id)
    await db.transaction(async (tx) => {
      await tx.exec('set local role service_role')
      await tx.query('select public.release_invite_email($1)', [id])
    })
    // The failed send no longer blocks a retry.
    expect(await claim('alice', id)).toHaveLength(1)
  })

  it('does not let owners release claims (that would bypass the limits)', async () => {
    const id = await invite('carol@example.com')
    await claim('alice', id)
    await expect(as('alice', 'select public.release_invite_email($1)', [id])).rejects.toThrow(/permission denied/)
    await expect(claim('alice', id)).rejects.toThrow(/sent an invite recently/)
  })

  it('keeps the email log out of reach of app users', async () => {
    await claim('alice', await invite('carol@example.com'))
    await expect(as('alice', 'select * from invite_email_log')).rejects.toThrow(/permission denied/)
    await expect(as('alice', 'delete from invite_email_log')).rejects.toThrow(/permission denied/)
  })

  it('is not available to signed-out visitors', async () => {
    const id = await invite('carol@example.com')
    await expect(
      db.transaction(async (tx) => {
        await tx.exec('set local role anon')
        return tx.query('select * from public.claim_invite_email($1)', [id])
      }),
    ).rejects.toThrow(/permission denied/)
  })
})

describe('signed-out visitors', () => {
  async function asAnon(sql: string) {
    return db.transaction(async (tx) => {
      await tx.exec('set local role anon')
      return tx.query(sql)
    })
  }

  it('cannot write to any table', async () => {
    for (const table of ['organizations', 'organization_members', 'organization_invites', 'borrowers', 'loans', 'payments']) {
      await expect(asAnon(`delete from public.${table}`)).rejects.toThrow(/permission denied/)
    }
    await expect(asAnon("update public.organization_members set role = 'owner'")).rejects.toThrow(/permission denied/)
  })
})

describe('organisation names (security fix)', () => {
  // Names go into invite emails sent from this project's address, so no links or markup.
  it.each(REFUSED_ORG_NAMES)('refuses %j for a new organisation', async (name) => {
    await expect(createOrg('alice', name)).rejects.toThrow(/organizations_name_plain/)
  })

  it.each(ACCEPTED_ORG_NAMES)('accepts %j', async (name) => {
    expect(await createOrg('alice', name)).toBeTruthy()
  })

  it('refuses renaming an organisation to a link', async () => {
    const org = await createOrg('alice', 'Renamers')
    await expect(as('alice', "update organizations set name = 'Go to evil.com' where id = $1", [org])).rejects.toThrow(/organizations_name_plain/)
  })

  it('refuses to email invites from an organisation whose older name has a link', async () => {
    const org = await createOrg('alice', 'Legacy')
    // Simulate a name saved before the check existed (the constraint is NOT VALID for old rows).
    await db.exec('alter table organizations drop constraint organizations_name_plain')
    await db.query("update organizations set name = 'Legacy evil.com' where id = $1", [org])
    await db.exec(`alter table organizations add constraint organizations_name_plain check (public.is_plain_org_name(name)) not valid`)
    const [i] = await as<{ id: string }>('alice', "insert into organization_invites (org_id, email) values ($1, 'legacy@example.com') returning id", [org])
    await expect(as('alice', 'select * from public.claim_invite_email($1)', [i.id])).rejects.toThrow(/Rename the organisation/)
  })
})

describe('daily invite email cap (security fix)', () => {
  it('stops all invite emails once the project has sent 200 in a day', async () => {
    await db.query('delete from invite_email_log')
    const org = await createOrg('alice', 'Capped')
    await db.query(
      "insert into invite_email_log (sender, recipient, org_id) select gen_random_uuid(), 'r' || g || '@example.com', $1 from generate_series(1, 200) g",
      [org],
    )
    const [i] = await as<{ id: string }>('alice', "insert into organization_invites (org_id, email) values ($1, 'one-more@example.com') returning id", [org])
    await expect(as('alice', 'select * from public.claim_invite_email($1)', [i.id])).rejects.toThrow(/daily invite emails/)
    await db.query('delete from invite_email_log')
  })
})

describe('keeping an owner (security fix)', () => {
  let org: string

  beforeAll(async () => {
    org = await createOrg('alice', 'Owned')
    const [invite] = await as<{ id: string }>('alice', "insert into organization_invites (org_id, email, role) values ($1, 'bob@example.com', 'owner') returning id", [org])
    await as('bob', 'select public.accept_invite($1)', [invite.id])
  })

  const role = (user: User) => as('alice', 'select role from organization_members where org_id = $1 and user_id = $2', [org, users[user].id])

  it('lets an owner step down while another owner remains', async () => {
    await as('bob', "update organization_members set role = 'member' where org_id = $1 and user_id = $2", [org, users.bob.id])
    expect(await role('bob')).toEqual([{ role: 'member' }])
  })

  it('stops the last owner stepping down', async () => {
    await expect(as('alice', "update organization_members set role = 'viewer' where org_id = $1 and user_id = $2", [org, users.alice.id])).rejects.toThrow(
      /needs at least one owner/,
    )
    expect(await role('alice')).toEqual([{ role: 'owner' }])
  })

  it('still deletes the organisation when its last member leaves', async () => {
    const solo = await createOrg('carol', 'Solo leaver')
    await as('carol', 'select public.leave_organization($1)', [solo])
    expect((await db.query('select 1 from organizations where id = $1', [solo])).rows).toHaveLength(0)
  })
})

describe('who created a record (security fix)', () => {
  let org: string
  let borrower: string
  let loan: string

  beforeAll(async () => {
    org = await createOrg('alice', 'Audit trail')
    const [invite] = await as<{ id: string }>('alice', "insert into organization_invites (org_id, email) values ($1, 'bob@example.com') returning id", [org])
    await as('bob', 'select public.accept_invite($1)', [invite.id])
    ;[{ id: borrower }] = await as<{ id: string }>('alice', "insert into borrowers (org_id, name) values ($1, 'Lerato') returning id", [org])
    ;[{ id: loan }] = await as<{ id: string }>('alice', "insert into loans (org_id, borrower_id, principal_cents, due_on) values ($1, $2, 100, '2026-12-01') returning id", [org, borrower])
  })

  it.each([
    ['borrowers', () => borrower],
    ['loans', () => loan],
    ['organizations', () => org],
  ])('keeps created_by on %s', async (table, id) => {
    const changer = table === 'organizations' ? 'alice' : 'bob'
    await expect(as(changer, `update ${table} set created_by = $2 where id = $1`, [id(), users.carol.id])).rejects.toThrow(/cannot be changed/)
  })

  it('still lets members edit everything else', async () => {
    await as('bob', "update loans set note = 'Car repair' where id = $1", [loan])
    await as('bob', "update borrowers set name = 'Lerato M' where id = $1", [borrower])
  })
})
