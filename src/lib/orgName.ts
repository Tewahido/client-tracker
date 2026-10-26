export const ORG_NAME_MAX = 80

// Mirrors public.is_plain_org_name (supabase/migrations/20261026000000_plain_org_names.sql),
// which is what actually enforces it: names go into invite emails, so no links or markup.
const MARKUP = /[<>]/
const LINK = /(:\/\/|www\.)/i
const DOMAIN =
  /\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|net|org|info|biz|io|co|app|dev|xyz|online|site|link|me|ly|za|uk|us|ru|cn|top|click|shop|live|support|help|bank|pay|money)\b/i

/** A friendly message for the first thing wrong with an organisation name, or null. */
export function orgNameProblem(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Give your organisation a name'
  if (trimmed.length > ORG_NAME_MAX) return `Keep it under ${ORG_NAME_MAX} characters`
  if (MARKUP.test(trimmed) || LINK.test(trimmed) || DOMAIN.test(trimmed)) return "Names can't include web addresses or < >"
  return null
}
