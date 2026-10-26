export const ORG_NAME_MAX = 80

// Identical to public.is_plain_org_name (supabase/migrations/20261026000000_plain_org_names.sql),
// which is what actually enforces it: names go into invite emails, so no links or markup.
const MARKUP = /[<>]/
const LINK = /(:\/\/|www\.)/i
/** A dot or look-alike dot between a word character and two more: any domain, short link or IP. */
const DOMAIN = /[a-z0-9_\u0080-\u009f\u00a1-\u1fff\u2070-\uffff-][.\uff0e\u3002\uff61][a-z0-9\u0080-\u009f\u00a1-\u1fff\u2070-\uffff]{2,}/i

/** A friendly message for the first thing wrong with an organisation name, or null. */
export function orgNameProblem(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Give your organisation a name'
  if (trimmed.length > ORG_NAME_MAX) return `Keep it under ${ORG_NAME_MAX} characters`
  if (MARKUP.test(trimmed) || LINK.test(trimmed) || DOMAIN.test(trimmed)) return "Names can't include web addresses or < >"
  return null
}
