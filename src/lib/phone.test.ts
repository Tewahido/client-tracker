import { describe, expect, it } from 'vitest'
import { isValidPhone, normalisePhone } from './phone'

// Built from code points so the invisible characters survive editors and copy-paste.
const ch = (...codes: number[]) => String.fromCharCode(...codes)
const LTR_EMBED = ch(0x202a)
const POP = ch(0x202c)
const LTR_MARK = ch(0x200e)
const ZERO_WIDTH = ch(0x200b)
const NBSP = ch(0x00a0)
const NB_HYPHEN = ch(0x2011)
const EN_DASH = ch(0x2013)
const MINUS = ch(0x2212)
const FULLWIDTH_PLUS = ch(0xff0b)

describe('normalisePhone', () => {
  it.each([
    ['copied from iPhone Contacts or WhatsApp (direction marks)', `${LTR_EMBED}082 722 4979${POP}`, '082 722 4979'],
    ['a left-to-right mark before an international number', `${LTR_MARK}+27 82 722 4979`, '+27 82 722 4979'],
    ['non-breaking spaces, and zero-width ones (which show no gap)', `082${NBSP}722${ZERO_WIDTH}4979`, '082 7224979'],
    ['look-alike dashes', `082${NB_HYPHEN}722${EN_DASH}4979${MINUS}1`, '082-722-4979-1'],
    ['a full-width plus', `${FULLWIDTH_PLUS}27 82 722 4979`, '+27 82 722 4979'],
    ['extra spaces around and inside', '  082   722  4979 ', '082 722 4979'],
  ])('cleans %s', (_label, input, expected) => {
    expect(normalisePhone(input)).toBe(expected)
  })
})

describe('isValidPhone', () => {
  it.each([`${LTR_EMBED}082 722 4979${POP}`, '082 722 4979', '+27 (82) 722-4979', `082${NBSP}722${NBSP}4979`])('accepts %j', (input) => {
    expect(isValidPhone(input)).toBe(true)
  })

  it.each(['12345', 'call me', '082 722 4979 ext', '27+82 722 4979'])('refuses %j', (input) => {
    expect(isValidPhone(input)).toBe(false)
  })
})
