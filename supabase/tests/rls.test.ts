/**
 * Runs the real migration in PGlite (Postgres compiled to WASM) with small stubs
 * for Supabase's `auth` schema, then exercises Row Level Security as different
 * users. Catches policy mistakes without needing a Supabase project.
 */
import { PGlite } from '@electric-sql/pglite'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

const MIGRATIONS = join(__dirname, '..', 'migrations')

const SUPABASE_STUBS = `
  create role authenticated nologin;
  create role anon nologin;
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
  alter default privileges in schema public grant all on tables to authenticated;
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
