import type { Locator, Page } from '@playwright/test'
import { AppPage } from './AppPage'
import { Dialog } from './Dialog'

declare global {
  interface Window {
    /** Text handed to the (stubbed) system share sheet, newest last. */
    __shared?: string[]
  }
}

/** "Invite sent" dialog: shown when Lendly emailed the invite. */
export class InviteSentDialog extends Dialog {
  /** Backup: share or copy the invite yourself. */
  readonly sendButton: Locator
  readonly doneButton: Locator

  constructor(page: Page) {
    super(page, 'Invite sent')
    this.sendButton = this.root.getByRole('button', { name: /Share invite|Copy invite message|Copied/ })
    this.doneButton = this.root.getByRole('button', { name: 'Done' })
  }
}

/** "Invite ready" dialog: next steps when the invite couldn't be emailed. */
export class InviteReadyDialog extends Dialog {
  /** "Share invite" on phones, "Copy invite message" elsewhere. */
  readonly sendButton: Locator
  readonly doneButton: Locator

  constructor(page: Page) {
    super(page, 'Invite ready')
    this.sendButton = this.root.getByRole('button', { name: /Share invite|Copy invite message|Copied/ })
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
  readonly inviteSent: InviteSentDialog

  constructor(page: Page) {
    super(page)
    this.inviteEmail = page.getByLabel('Email', { exact: true })
    this.inviteRole = page.getByLabel('Role', { exact: true })
    this.inviteButton = page.getByRole('button', { name: 'Invite', exact: true })
    this.roleInfoButton = page.getByRole('button', { name: 'What each role can do' })
    this.roleGuide = page.getByRole('region', { name: 'What each role can do' })
    this.inviteReady = new InviteReadyDialog(page)
    this.inviteSent = new InviteSentDialog(page)
  }

  /**
   * Record what gets shared or copied: stubs the system share sheet (phones use it) and
   * allows clipboard access (desktop copies). Call before open().
   */
  async captureInviteMessages() {
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await this.page.addInitScript(() => {
      window.__shared = []
      navigator.share = async (data?: ShareData) => {
        window.__shared!.push(data?.text ?? '')
      }
    })
  }

  /** The last invite message shared (phones) or copied (desktop). */
  async lastInviteMessage(): Promise<string> {
    return this.page.evaluate(async () => window.__shared?.at(-1) ?? (await navigator.clipboard.readText()))
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

  shareInviteFor(email: string) {
    return this.page.getByRole('button', { name: new RegExp(`^(Share|Copy) invite message for ${email.replace('.', '\\.')}$`) })
  }

  /** Whether the page is wider than the window (something forces sideways scrolling). */
  async overflowsHorizontally() {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  }

  text(value: string | RegExp) {
    return this.page.getByText(value)
  }
}
