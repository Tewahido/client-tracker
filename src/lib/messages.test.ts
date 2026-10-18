import { describe, expect, it } from 'vitest'
import { fillTemplate, internationalDigits, smsLink, whatsappLink } from './messages'

describe('fillTemplate', () => {
  it('fills known placeholders and keeps unknown ones', () => {
    expect(fillTemplate('Hi {name}, {amount} due {due}. {other}', { name: 'Sipho', amount: 'R500', due: 'tomorrow' })).toBe(
      'Hi Sipho, R500 due tomorrow. {other}',
    )
  })

  it('trims trailing whitespace left by an empty signature', () => {
    expect(fillTemplate('Thanks! {lender}', { lender: '' })).toBe('Thanks!')
  })
})

describe('internationalDigits', () => {
  it.each([
    ['082 123 4567', '27821234567'],
    ['+27 82 123 4567', '27821234567'],
    ['0027821234567', '27821234567'],
    ['27821234567', '27821234567'],
  ])('%s -> %s', (input, expected) => {
    expect(internationalDigits(input, '27')).toBe(expected)
  })
})

describe('links', () => {
  it('builds WhatsApp and SMS links with encoded text', () => {
    expect(whatsappLink('082 123 4567', '27', 'Hi & bye')).toBe('https://wa.me/27821234567?text=Hi%20%26%20bye')
    expect(smsLink('+27 82 123-4567', 'Hi')).toBe('sms:+27821234567?&body=Hi')
  })
})
