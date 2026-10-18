import { describe, expect, it } from 'vitest'
import { withFreshIds } from './snapshot'
import type { Snapshot } from './types'

describe('withFreshIds', () => {
  it('renames every id while keeping references and dropping orphans', () => {
    const snapshot = {
      borrowers: [{ id: 'b1', name: 'A' }],
      loans: [
        { id: 'l1', borrowerId: 'b1' },
        { id: 'orphan', borrowerId: 'missing' },
      ],
      payments: [
        { id: 'p1', loanId: 'l1' },
        { id: 'p2', loanId: 'orphan' },
      ],
    } as unknown as Snapshot
    let n = 0
    const result = withFreshIds(snapshot, () => `new-${++n}`)

    expect(result.borrowers.map((b) => b.id)).toEqual(['new-1'])
    expect(result.loans).toHaveLength(1)
    expect(result.loans[0]).toMatchObject({ borrowerId: 'new-1' })
    expect(result.payments).toHaveLength(1)
    expect(result.payments[0]).toMatchObject({ loanId: result.loans[0].id })
    expect(result.payments[0].id).not.toBe('p1')
  })
})
