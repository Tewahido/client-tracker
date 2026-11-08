import { describe, expect, it } from 'vitest'
import { base64UrlToBytes, readPushMessage } from './push'

describe('base64UrlToBytes', () => {
  it('decodes the URL-safe base64 a VAPID public key is written in', () => {
    // "-" and "_" stand for "+" and "/", and padding is left off.
    expect([...base64UrlToBytes('-_8')]).toEqual([0xfb, 0xff])
    expect(base64UrlToBytes('BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U')).toHaveLength(65)
  })
})

describe('readPushMessage', () => {
  it('reads the reminder the server sent', () => {
    expect(readPushMessage({ title: 'Sipho is 3 days overdue', body: 'R1,500.00 still owed.', tag: 'l1:2026-11-08:overdue-3', url: '#loans?open=l1&org=o1' })).toEqual({
      title: 'Sipho is 3 days overdue',
      body: 'R1,500.00 still owed.',
      tag: 'l1:2026-11-08:overdue-3',
      url: '#loans?open=l1&org=o1',
    })
  })

  it('still shows something for an odd message, and only opens links inside the app', () => {
    expect(readPushMessage(null)).toEqual({ title: 'Lendly', body: 'You have a payment reminder.', tag: 'lendly-push', url: '#home' })
    expect(readPushMessage({ title: 'Hi', url: 'https://evil.example' }).url).toBe('#home')
    expect(readPushMessage({ title: 42 }).title).toBe('Lendly')
  })
})
