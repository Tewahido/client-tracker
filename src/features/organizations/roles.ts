import type { OrgRole } from '../../services/organizations'

/** Roles in the order they're offered, with what each one can do. */
export const ROLES: { value: OrgRole; label: string; can: string }[] = [
  { value: 'owner', label: 'Owner', can: 'Full control, including managing members and deleting things.' },
  { value: 'member', label: 'Member', can: 'Adds and edits loans, people and payments.' },
  { value: 'viewer', label: 'Viewer', can: 'Can look at everything but not change anything.' },
]

export const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label])) as Record<OrgRole, string>
