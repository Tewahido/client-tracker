import type { Locator, Page } from '@playwright/test'
import { AppPage } from './AppPage'

/** The Organisations page (Supabase mode): every organisation I belong to, and invites for me. */
export class OrganisationsPage extends AppPage {
  readonly list: Locator
  /** The organisation menu the current organisation opens (top bar on phones, sidebar on desktop). */
  readonly menu: Locator
  /** Banner on other screens saying invites are waiting, and its button to this page. */
  readonly inviteBanner: Locator
  readonly seeInvitesButton: Locator

  constructor(page: Page) {
    super(page)
    this.list = page.getByRole('list', { name: 'Your organisations' })
    this.menu = page.getByRole('group', { name: 'Organisations' }).locator('visible=true')
    this.inviteBanner = page.getByRole('region', { name: 'Invitations' })
    this.seeInvitesButton = this.inviteBanner.getByRole('button', { name: /^See invites?$/ })
  }

  async open() {
    await this.page.goto('/#organisations')
  }

  /** Get to this page the way someone would: from the organisation menu (top bar or sidebar). */
  async openFromNav() {
    await this.currentOrgButton().click()
    await this.menuItem('All organisations').click()
  }

  /** Whether the open organisation menu fits inside the window (not cut off at an edge). */
  async menuFitsWindow() {
    const box = await this.menu.boundingBox()
    const width = await this.page.evaluate(() => document.documentElement.clientWidth)
    return !!box && box.x >= 0 && box.x + box.width <= width
  }

  /** An organisation (or other entry) in the organisation menu. */
  menuItem(name: string) {
    return this.menu.getByRole('button', { name, exact: true })
  }

  /** The visible "current organisation" control: top bar on phones, sidebar on desktop. */
  currentOrgButton() {
    return this.page.getByRole('button', { name: /^Organisation:/ }).locator('visible=true')
  }

  org(name: string) {
    return this.list.getByRole('listitem').filter({ hasText: name })
  }

  openButton(name: string) {
    return this.page.getByRole('button', { name: `Open ${name}`, exact: true })
  }

  /** The Join button on the invite from `orgName`. */
  joinButton(orgName: string) {
    return this.page.getByRole('listitem').filter({ hasText: orgName }).getByRole('button', { name: 'Join' })
  }

  /** The Decline button on the invite from `orgName`. */
  declineButton(orgName: string) {
    return this.page.getByRole('listitem').filter({ hasText: orgName }).getByRole('button', { name: 'Decline' })
  }

  /** Confirm declining in the dialog the Decline button opens. */
  async confirmDecline() {
    await this.page.getByRole('dialog', { name: 'Decline this invite?' }).getByRole('button', { name: 'Decline', exact: true }).click()
  }

  /** The note saying which email address invites are matched to. */
  invitesSentTo(email: string) {
    return this.page.getByText(`Invites are sent to ${email}`)
  }

  personNamed(name: string) {
    return this.page.getByText(name, { exact: true })
  }
}
