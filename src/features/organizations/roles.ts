import type { OrgRole } from '../../services/organizations'

/** Roles in the order they're offered, with what each one can do. */
export const ROLES: { value: OrgRole; label: string; article: 'a' | 'an'; can: string }[] = [
  { value: 'owner', label: 'Owner', article: 'an', can: 'Full control, including managing members and deleting things.' },
  { value: 'member', label: 'Member', article: 'a', can: 'Adds and edits loans, people and payments.' },
  { value: 'viewer', label: 'Viewer', article: 'a', can: 'Can look at everything but not change anything.' },
]

export const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label])) as Record<OrgRole, string>

/** "an Owner", "a Member"… */
export const withArticle = (role: OrgRole) => {
  const r = ROLES.find((x) => x.value === role)!
  return `${r.article} ${r.label}`
}
