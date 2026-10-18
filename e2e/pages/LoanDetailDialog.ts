import type { Page } from '@playwright/test'
import { Dialog } from './Dialog'

/** The "Loan details" dialog: balance, actions and payment history. */
export class LoanDetailDialog extends Dialog {
  constructor(page: Page) {
    super(page, 'Loan details')
  }

  /** The large balance figure under "Still owed" / "Fully repaid". */
  readonly balance = this.root.getByText(/^R\s?[\d,]+\.\d{2}$/).first()

  status(label: string) {
    return this.root.getByText(label, { exact: true }).first()
  }

  async recordPayment() {
    await this.button('Record payment').click()
  }

  async markFullyPaid() {
    await this.button('Mark fully paid').click()
  }
}
