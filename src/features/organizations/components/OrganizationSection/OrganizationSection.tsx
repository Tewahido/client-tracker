import { cn } from '../../../../lib/cn'
import { Building2, Clock, Copy, LogOut, Trash2, UserMinus, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { SettingsSection } from '../../../../components/layout/SettingsSection'
import { Avatar, Button, ConfirmDialog, InfoTip, SelectInput, TextInput } from '../../../../components/ui'
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard'
import { formatDate } from '../../../../lib/dates'
import { useWorkspace } from '../../../../providers/workspaceContext'
import type { Member, OrgRole } from '../../../../services/organizations'
import { useInviteForm } from '../../hooks/useInviteForm'
import { useRenameOrgForm } from '../../hooks/useRenameOrgForm'
import { useOrganizationAdmin, type OrganizationAdmin } from '../../hooks/useOrganizationAdmin'
import { ROLE_LABEL, ROLES } from '../../roles'
import { InviteList } from '../InviteList'
import { InviteSentDialog } from '../InviteSentDialog'
import { organizationSectionStyles as s } from './OrganizationSection.styles'

type Confirm = { kind: 'leave' } | { kind: 'delete' } | { kind: 'remove'; member: Member } | null

/** Settings section for the active organisation: name, members, invites, leaving and deleting. */
export function OrganizationSection({ onCreateOrg }: { onCreateOrg: () => void }) {
  const admin = useOrganizationAdmin()
  const { organizations, switchOrg, user, signOut } = useWorkspace()
  const [confirm, setConfirm] = useState<Confirm>(null)
  const { org, isOwner } = admin
  if (!org) return null

  return (
    <SettingsSection icon={Building2} title="Organisation" description="Everyone in an organisation sees and edits the same people and loans.">
      {organizations.length > 1 && (
        <SelectInput label="Active organisation" value={org.id} onChange={(e) => switchOrg(e.target.value)}>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </SelectInput>
      )}

      {isOwner ? <RenameForm key={org.id} name={org.name} onRename={admin.rename} /> : null}

      <InviteList />

      <div className={s.block}>
        <div className={s.blockTitle}>Members</div>
        <MemberList admin={admin} onRemove={(member) => setConfirm({ kind: 'remove', member })} />
      </div>

      {isOwner && <InviteBlock admin={admin} />}

      <div className={s.footer}>
        <span className={s.footerText}>
          Signed in as <span className={s.strong}>{user?.email}</span>
        </span>
        <div className={s.footerActions}>
          <Button variant="ghost" size="sm" icon={Building2} onClick={onCreateOrg}>
            New organisation
          </Button>
          <Button variant="secondary" size="sm" icon={LogOut} onClick={() => setConfirm({ kind: 'leave' })}>
            Leave
          </Button>
          {isOwner && (
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirm({ kind: 'delete' })}>
              Delete
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm?.kind === 'leave'}
        title={`Leave ${org.name}?`}
        message={
          admin.members.length <= 1
            ? "You're the only member, so leaving deletes the organisation and all of its loans."
            : "You'll lose access to its people and loans until someone invites you again."
        }
        confirmLabel="Leave"
        danger
        onConfirm={admin.leave}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.kind === 'delete'}
        title={`Delete ${org.name}?`}
        message="This permanently deletes the organisation and every person, loan and payment in it, for all members."
        confirmLabel="Delete for everyone"
        danger
        onConfirm={admin.deleteOrg}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.kind === 'remove'}
        title="Remove member?"
        message={confirm?.kind === 'remove' ? `${confirm.member.email} will lose access to ${org.name}.` : ''}
        confirmLabel="Remove"
        danger
        onConfirm={() => (confirm?.kind === 'remove' ? admin.removeMember(confirm.member.userId) : undefined)}
        onClose={() => setConfirm(null)}
      />
    </SettingsSection>
  )
}

function RenameForm({ name, onRename }: { name: string; onRename: (name: string) => Promise<boolean> }) {
  const { value, setValue, busy, changed, submit } = useRenameOrgForm(name, onRename)

  return (
    <form className={s.inline} onSubmit={submit}>
      <TextInput label="Name" value={value} onChange={(e) => setValue(e.target.value)} className={s.grow} maxLength={80} />
      <Button type="submit" variant="secondary" disabled={!changed} loading={busy}>
        Save
      </Button>
    </form>
  )
}

function MemberList({ admin, onRemove }: { admin: OrganizationAdmin; onRemove: (member: Member) => void }) {
  const { members, me, isOwner, owners, setRole, loading } = admin
  if (loading) return <p className={s.hint}>Loading members…</p>

  return (
    <ul className={s.list}>
      {members.map((m) => {
        const isMe = m.userId === me?.id
        // Owners can manage others; nobody can demote the last owner.
        const canChangeRole = isOwner && !(m.role === 'owner' && owners <= 1)
        return (
          <li key={m.userId} className={s.member}>
            <Avatar name={m.email} size="sm" />
            <div className={s.memberMain}>
              <div className={s.memberEmail}>
                {m.email}
                {isMe && <span className={s.you}>You</span>}
              </div>
              <div className={s.memberMeta}>Joined {formatDate(m.joinedAt.slice(0, 10))}</div>
            </div>
            {canChangeRole ? (
              <select className={s.roleSelect} value={m.role} onChange={(e) => setRole(m.userId, e.target.value as OrgRole)} aria-label={'Role for ' + m.email}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className={cn(s.role, m.role === 'owner' ? s.roleOwner : s.roleMember)}>{ROLE_LABEL[m.role]}</span>
            )}
            {isOwner && !isMe && (
              <div className={s.memberActions}>
                <Button variant="ghost" size="sm" iconOnly icon={UserMinus} aria-label="Remove member" title="Remove" onClick={() => onRemove(m)} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function InviteBlock({ admin }: { admin: OrganizationAdmin }) {
  const form = useInviteForm(admin.invite)
  const copy = useCopyToClipboard()
  const copyLink = () => copy(window.location.origin, 'Link copied')

  return (
    <div className={s.block}>
      <div className={s.blockTitle}>Invite someone</div>
      <form className={s.inviteForm} onSubmit={form.submit} noValidate>
        <TextInput label="Email" type="email" value={form.email} onChange={(e) => form.setEmail(e.target.value)} placeholder="partner@example.com" error={form.error} />
        <SelectInput
          label="Role"
          labelAccessory={
            <InfoTip label="What each role can do">
              <ul className={s.roleGuide}>
                {ROLES.map((r) => (
                  <li key={r.value}>
                    <span className={s.roleGuideName}>{r.label}</span> {r.can}
                  </li>
                ))}
              </ul>
            </InfoTip>
          }
          value={form.role}
          onChange={(e) => form.setRole(e.target.value as OrgRole)}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </SelectInput>
        <Button type="submit" icon={UserPlus} loading={form.busy}>
          Invite
        </Button>
      </form>

      {admin.invites.map((invite) => (
        <div key={invite.id} className={s.pending}>
          <Clock className={s.pendingIcon} />
          <span className={s.pendingEmail}>{invite.email}</span>
          <span className={s.hint}>{ROLE_LABEL[invite.role]} · pending</span>
          <Button variant="ghost" size="sm" iconOnly icon={Copy} aria-label={`Copy app link for ${invite.email}`} title="Copy app link" onClick={copyLink} />
          <Button variant="ghost" size="sm" iconOnly icon={X} aria-label={`Cancel invite for ${invite.email}`} onClick={() => admin.revokeInvite(invite.id)} />
        </div>
      ))}

      <InviteSentDialog invite={form.sent} orgName={admin.org?.name ?? ''} onCopyLink={copyLink} onClose={form.dismissSent} />
    </div>
  )
}
