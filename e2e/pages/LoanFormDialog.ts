import type { Page } from '@playwright/test'
import { Dialog } from './Dialog'

export interface NewLoan {
  person: string
  amount: string
  interest?: string
  note?: string
}

/** The "New loan" / "Edit loan" form. */
export class LoanFormDialog extends Dialog {
  constructor(page: Page, title: 'New loan' | 'Edit loan' = 'New loan') {
    super(page, title)
  }

  readonly amount = this.field('Amount')
  readonly interest = this.field('Interest %')
  readonly lentOn = this.field('Lent on')
  readonly dueOn = this.field('Due on')
  readonly lentTo = this.field('Lent to')

  /* Monthly repayment plan */
  readonly months = this.field('Months')
  readonly monthly = this.field('Each month')
  readonly total = this.field('Total to pay back')
  readonly firstPayment = this.field('First payment')
  /** The "12 payments of R2,000.00" summary under the plan. */
  readonly planSummary = this.root.getByText(/\d+ payments of/)

  /** Pick an existing person by name, or add them as someone new. */
  async choosePerson(person: string) {
    const existing = await this.lentTo.locator('option', { hasText: person }).count()
    if (existing) {
      await this.lentTo.selectOption({ label: person })
    } else {
      await this.lentTo.selectOption({ label: '+ Someone new' })
      await this.field('Their name').fill(person)
    }
  }

  /** Choose how the loan is paid back. */
  async payBack(how: 'All at once' | 'Monthly') {
    await this.root.getByRole('tablist', { name: 'Paid back' }).getByRole('tab', { name: how }).click()
  }

  async save() {
    await this.button('Add loan').click()
  }

  /** Fill the form for a loan to a new person (or an existing one, by name) and submit it. */
  async create({ person, amount, interest, note }: NewLoan) {
    await this.choosePerson(person)
    await this.amount.fill(amount)
    if (interest !== undefined) await this.interest.fill(interest)
    if (note) await this.field('Note').fill(note)
    await this.save()
  }
}
