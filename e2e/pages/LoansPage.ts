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

  /** The "Most urgent / Largest balance / Most recent" dropdown. */
  readonly sort = this.page.getByLabel('Sort loans')

  readonly search = this.page.getByRole('searchbox', { name: 'Search name or note' })

  /** True when the magnifying glass in the search box is drawn on top, not hidden behind the box. */
  async searchIconShows(): Promise<boolean> {
    return this.search.evaluate((input) => {
      const icon = input.parentElement?.querySelector('svg')
      if (!icon) return false
      // Hit-testing follows paint order, but skips pointer-events: none; lift that briefly.
      const previous = icon.style.pointerEvents
      icon.style.pointerEvents = 'auto'
      const box = icon.getBoundingClientRect()
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      icon.style.pointerEvents = previous
      return !!top && icon.contains(top)
    })
  }

  /** A loan row in the list, found by the borrower's name. */
  row(person: string) {
    return this.page.getByRole('button').filter({ hasText: person }).filter({ hasText: /R\s?[\d,]+\.\d{2}/ })
  }

  async filter(name: 'Open' | 'Overdue' | 'Due soon' | 'Closed' | 'All') {
    await this.page.getByRole('tab', { name: new RegExp(`^${name}`) }).click()
  }
}
