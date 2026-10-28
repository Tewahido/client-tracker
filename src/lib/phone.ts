/**
 * Phone numbers as people paste them. Phones add characters you can't see when copying a
 * number (iPhone Contacts and WhatsApp wrap it in left-to-right marks), and other apps use
 * look-alike spaces and dashes. Cleaning those up lets a pasted 082 722 4979 pass the check.
 */
export function normalisePhone(input: string): string {
  return (
    input
      // Compatibility forms to plain ones: full-width digits and plus, non-breaking spaces.
      .normalize('NFKC')
      // Invisible formatting characters: direction marks, zero-width spaces.
      .replace(/\p{Cf}/gu, '')
      // Every kind of dash, and the minus sign, to a plain hyphen.
      .replace(/[\p{Pd}\u2212]/gu, '-')
      // Every kind of space to one plain space.
      .replace(/\p{Zs}+/gu, ' ')
      .trim()
  )
}

/** Digits, spaces, brackets and dashes with an optional leading +, at least 6 characters. */
export function isValidPhone(input: string): boolean {
  return /^\+?[\d\s()-]{6,}$/.test(normalisePhone(input))
}
