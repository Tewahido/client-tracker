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
})
