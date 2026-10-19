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
  readonly dueOn = this.field('Due on')
  readonly lentTo = this.field('Lent to')

  /** Fill the form for a loan to a new person (or an existing one, by name) and submit it. */
  async create({ person, amount, interest, note }: NewLoan) {
    const existing = await this.lentTo.locator('option', { hasText: person }).count()
    if (existing) {
      await this.lentTo.selectOption({ label: person })
    } else {
      await this.lentTo.selectOption({ label: '+ Someone new' })
      await this.field('Their name').fill(person)
    }
    await this.amount.fill(amount)
    if (interest !== undefined) await this.interest.fill(interest)
    if (note) await this.field('Note').fill(note)
    await this.button('Add loan').click()
  }
}
