/** Replace {placeholders} in a reminder template. Unknown placeholders are left as-is. */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template
    .replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? values[key] : match))
    .replace(/[ \t]+$/gm, '')
    .trim()
}

/**
 * Digits-only international number for wa.me links. Local numbers starting with
 * a trunk 0 (e.g. "082 123 4567") get the default country code ("27" -> 27821234567).
 */
export function internationalDigits(phone: string, countryCode: string): string {
  const trimmed = phone.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+')) return digits
  if (digits.startsWith('00')) return digits.slice(2)
  if (digits.startsWith('0')) return countryCode.replace(/\D/g, '') + digits.slice(1)
  return digits
}

export function whatsappLink(phone: string, countryCode: string, text: string): string {
  return `https://wa.me/${internationalDigits(phone, countryCode)}?text=${encodeURIComponent(text)}`
}

export function smsLink(phone: string, text: string): string {
  // `?&body=` is understood by both iOS and Android messaging apps.
  return `sms:${phone.replace(/[^\d+]/g, '')}?&body=${encodeURIComponent(text)}`
}

export function emailLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
