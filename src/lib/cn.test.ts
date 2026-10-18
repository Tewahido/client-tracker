import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('lets later classes override conflicting ones, including our theme colours', () => {
    expect(cn('text-muted', 'text-fg')).toBe('text-fg')
    expect(cn('border-2 border-line', 'border-brand-400')).toBe('border-2 border-brand-400')
    expect(cn('text-xs text-muted', 'text-rose-500')).toBe('text-xs text-rose-500')
  })

  it('handles conditionals like clsx', () => {
    const active = false
    expect(cn('a', active && 'b', undefined, ['c'])).toBe('a c')
  })
})
