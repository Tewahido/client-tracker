import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('quotes cells with commas, quotes and newlines', () => {
    expect(toCsv(['a', 'b'], [['x, y', 'say "hi"'], ['line\nbreak', 3]])).toBe('a,b\r\n"x, y","say ""hi"""\r\n"line\nbreak",3\r\n')
  })

  it('renders empty values and guards against formula injection', () => {
    expect(toCsv(['a', 'b', 'c'], [[null, '=SUM(A1)', -5]])).toBe("a,b,c\r\n,'=SUM(A1),-5\r\n")
  })
})
