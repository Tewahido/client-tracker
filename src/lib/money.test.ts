import { describe, expect, it } from 'vitest'
import { centsToInput, parseMoney } from './money'

describe('parseMoney', () => {
  it.each([
    ['100', 10_000],
    ['1,250.5', 125_050],
    [' 0.99 ', 99],
    ['.5', 50],
    ['19.999', null],
    ['abc', null],
    ['', null],
    ['-5', null],
  ])('%j -> %j', (input, expected) => {
    expect(parseMoney(input)).toBe(expected)
  })
})

describe('centsToInput', () => {
  it('drops trailing zero cents', () => {
    expect(centsToInput(10_000)).toBe('100')
    expect(centsToInput(125_050)).toBe('1250.50')
  })
})
