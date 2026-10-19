import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('quotes cells with commas, quotes and newlines', () => {
    expect(toCsv(['a', 'b'], [['x, y', 'say "hi"'], ['line\nbreak', 3]])).toBe('a,b\r\n"x, y","say ""hi"""\r\n"line\nbreak",3\r\n')
  })

  it('renders empty values and guards against formula injection', () => {
    expect(toCsv(['a', 'b', 'c'], [[null, '=SUM(A1)', -5]])).toBe("a,b,c\r\n,'=SUM(A1),-5\r\n")
  })

  it('also guards formulas hidden behind a leading tab or carriage return', () => {
    expect(toCsv(['a'], [['\t=HYPERLINK("http://evil")']])).toBe('a\r\n"\'\t=HYPERLINK(""http://evil"")"\r\n')
    expect(toCsv(['a'], [['\r=1+1']])).toBe('a\r\n"\'\r=1+1"\r\n')
  })
})
