import type { Locator, Page } from '@playwright/test'
import { AppPage } from './AppPage'

/** The Organisations page (Supabase mode): every organisation I belong to, and invites for me. */
export class OrganisationsPage extends AppPage {
  /** Phones: the current organisation in the top bar, which opens this page. */
  readonly topBarButton: Locator
  /** Desktop: the organisation switcher at the bottom of the sidebar. */
  readonly switcherButton: Locator
  readonly list: Locator
  /** Banner on other screens saying invites are waiting, and its button to this page. */
  readonly inviteBanner: Locator
  readonly seeInvitesButton: Locator

  constructor(page: Page) {
    super(page)
    this.topBarButton = page.getByRole('banner').getByRole('button', { name: /^Organisation:/ })
    this.switcherButton = page.getByRole('complementary').getByRole('button', { name: /^Organisation:/ })
    this.list = page.getByRole('list', { name: 'Your organisations' })
    this.inviteBanner = page.getByRole('region', { name: 'Invitations' })
    this.seeInvitesButton = this.inviteBanner.getByRole('button', { name: /^See invites?$/ })
  }

  async open() {
    await this.page.goto('/#organisations')
  }

  /** Get to this page the way someone would: the top bar on phones, the sidebar switcher on desktop. */
  async openFromNav() {
    if (await this.topBarButton.isVisible()) {
      await this.topBarButton.click()
    } else {
      await this.switcherButton.click()
      await this.page.getByRole('button', { name: 'All organisations' }).click()
    }
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

  /** The note saying which email address invites are matched to. */
  invitesSentTo(email: string) {
    return this.page.getByText(`Invites are sent to ${email}`)
  }

  personNamed(name: string) {
    return this.page.getByText(name, { exact: true })
  }
}
