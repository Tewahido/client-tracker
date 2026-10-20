import type { Locator, Page } from '@playwright/test'
import { AppPage } from './AppPage'
import { Dialog } from './Dialog'

/** "Invite ready" dialog: next steps after inviting someone. */
export class InviteReadyDialog extends Dialog {
  readonly copyLinkButton: Locator
  readonly doneButton: Locator

  constructor(page: Page) {
    super(page, 'Invite ready')
    this.copyLinkButton = this.root.getByRole('button', { name: 'Copy app link' })
    this.doneButton = this.root.getByRole('button', { name: 'Done' })
  }
}

/** The Organisation section of Settings (Supabase mode): members and invites. */
export class OrganizationSettings extends AppPage {
  readonly inviteEmail: Locator
  readonly inviteRole: Locator
  readonly inviteButton: Locator
  readonly roleInfoButton: Locator
  readonly roleGuide: Locator
  readonly inviteReady: InviteReadyDialog

  constructor(page: Page) {
    super(page)
    this.inviteEmail = page.getByLabel('Email', { exact: true })
    this.inviteRole = page.getByLabel('Role', { exact: true })
    this.inviteButton = page.getByRole('button', { name: 'Invite', exact: true })
    this.roleInfoButton = page.getByRole('button', { name: 'What each role can do' })
    this.roleGuide = page.getByRole('region', { name: 'What each role can do' })
    this.inviteReady = new InviteReadyDialog(page)
  }

  async open() {
    await this.goto('settings')
  }

  async invite(email: string, role: 'Owner' | 'Member' | 'Viewer' = 'Member') {
    await this.inviteEmail.fill(email)
    await this.inviteRole.selectOption({ label: role })
    await this.inviteButton.click()
  }

  /** Whether the role guide fits inside the window horizontally (not cut off at an edge). */
  async roleGuideFitsWindow() {
    const box = await this.roleGuide.boundingBox()
    const width = this.page.viewportSize()?.width ?? 0
    return !!box && box.x >= 0 && box.x + box.width <= width
  }

  pendingInvite(email: string) {
    return this.page.getByRole('button', { name: `Cancel invite for ${email}` })
  }

  text(value: string | RegExp) {
    return this.page.getByText(value)
  }
}
