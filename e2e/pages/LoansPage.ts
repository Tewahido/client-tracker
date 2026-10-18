import type { Page } from '@playwright/test'
import { AppPage } from './AppPage'

/** The Loans list. */
export class LoansPage extends AppPage {
  constructor(page: Page) {
    super(page)
  }

  async open() {
    await this.goto('loans')
  }

  /** A loan row in the list, found by the borrower's name. */
  row(person: string) {
    return this.page.getByRole('button').filter({ hasText: person }).filter({ hasText: /R\s?[\d,]+\.\d{2}/ })
  }

  async filter(name: 'Open' | 'Overdue' | 'Due soon' | 'Closed' | 'All') {
    await this.page.getByRole('tab', { name: new RegExp(`^${name}`) }).click()
  }
}
