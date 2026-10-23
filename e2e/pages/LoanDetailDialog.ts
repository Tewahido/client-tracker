import type { Page } from '@playwright/test'
import { Dialog } from './Dialog'

/** The "Loan details" dialog: balance, actions and payment history. */
export class LoanDetailDialog extends Dialog {
  constructor(page: Page) {
    super(page, 'Loan details')
  }

  /** The large balance figure under "Still owed" / "Fully repaid". */
  readonly balance = this.root.getByText(/^R\s?[\d,]+\.\d{2}$/).first()

  /** A monthly plan's instalments, in order. */
  readonly instalments = this.root.getByRole('list', { name: 'Repayment plan' }).getByRole('listitem')

  /** The warning about missed instalments, e.g. "2 missed instalments · R2,000.00 behind". */
  readonly behind = this.root.getByRole('status').filter({ hasText: 'behind' })

  status(label: string) {
    return this.root.getByText(label, { exact: true }).first()
  }

  /** The instalment at 1-based position `number`. */
  instalment(number: number) {
    return this.instalments.nth(number - 1)
  }

  async recordPayment() {
    await this.button('Record payment').click()
  }

  async edit() {
    await this.button('Edit').click()
  }

  async markFullyPaid() {
    await this.button('Mark fully paid').click()
  }

  /** Open the borrower's page from the top of the dialog. */
  async openPerson() {
    await this.root.getByRole('button', { name: /View all their loans/ }).click()
  }
}
