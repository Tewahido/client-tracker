import { describe, expect, it } from 'vitest'
import { parseBackup, serializeBackup } from './backup'
import type { Snapshot } from './types'

const snapshot: Snapshot = {
  borrowers: [{ id: 'b', name: 'Lerato', phone: null, email: null, notes: null, createdAt: '2026-10-01T00:00:00Z' }],
  loans: [
    {
      id: 'l',
      borrowerId: 'b',
      principalCents: 10_000,
      interestRate: 0,
      lentOn: '2026-10-01',
      dueOn: '2026-11-01',
      note: null,
      writtenOffOn: null,
      instalmentCount: null,
      firstDueOn: null,
      agreedTotalCents: null,
      createdAt: '2026-10-01T00:00:00Z',
    },
  ],
  payments: [{ id: 'p', loanId: 'l', amountCents: 5_000, paidOn: '2026-10-10', note: null, createdAt: '2026-10-10T00:00:00Z' }],
}

describe('backup', () => {
  it('round-trips a snapshot', () => {
    expect(parseBackup(serializeBackup(snapshot)).data).toEqual(snapshot)
  })

  it.each([
    ['not json', /not valid JSON/],
    ['{"hello":1}', /isn't a Lendly backup/],
    ['{"format":"lendly-backup","version":99,"data":{}}', /newer version/],
    ['{"format":"lendly-backup","version":1,"data":{"borrowers":[]}}', /missing/],
  ])('rejects %s', (text, message) => {
    expect(() => parseBackup(text)).toThrow(message)
  })

  it('points at the broken entry', () => {
    const broken = JSON.parse(serializeBackup(snapshot))
    broken.data.loans[0].principalCents = 'lots'
    expect(() => parseBackup(JSON.stringify(broken))).toThrow('invalid loan (entry 1)')
  })

  it('rejects zero amounts, which the database would refuse mid-restore', () => {
    const zero = JSON.parse(serializeBackup(snapshot))
    zero.data.payments[0].amountCents = 0
    expect(() => parseBackup(JSON.stringify(zero))).toThrow('invalid payment (entry 1)')
  })

  it('round-trips a monthly plan', () => {
    const planned = { ...snapshot, loans: [{ ...snapshot.loans[0], instalmentCount: 12, firstDueOn: '2026-11-01', dueOn: '2027-10-01', agreedTotalCents: 24_000 }] }
    expect(parseBackup(serializeBackup(planned)).data).toEqual(planned)
  })

  it('reads backups from before monthly plans as once-off loans', () => {
    const old = JSON.parse(serializeBackup(snapshot))
    old.version = 1
    for (const key of ['instalmentCount', 'firstDueOn', 'agreedTotalCents']) delete old.data.loans[0][key]
    expect(parseBackup(JSON.stringify(old)).data).toEqual(snapshot)
  })

  it.each([
    ['a count without a first date', { instalmentCount: 12 }],
    ['a single instalment', { instalmentCount: 1, firstDueOn: '2026-11-01', agreedTotalCents: 24_000 }],
    ['a plan without a total', { instalmentCount: 12, firstDueOn: '2026-11-01' }],
    ['a first date without a count', { firstDueOn: '2026-11-01' }],
  ])('rejects %s', (_label, plan) => {
    const broken = JSON.parse(serializeBackup(snapshot))
    Object.assign(broken.data.loans[0], plan)
    expect(() => parseBackup(JSON.stringify(broken))).toThrow('invalid loan (entry 1)')
  })

  it('rejects duplicate ids', () => {
    const dup = JSON.parse(serializeBackup(snapshot))
    dup.data.loans.push({ ...dup.data.loans[0] })
    expect(() => parseBackup(JSON.stringify(dup))).toThrow('lists some loans more than once')
  })
})
