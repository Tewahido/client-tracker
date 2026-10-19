import type { Page } from '@playwright/test'
import { Dialog } from './Dialog'

/** The "Record a payment" form. */
export class PaymentDialog extends Dialog {
  constructor(page: Page) {
    super(page, 'Record a payment')
  }

  readonly amount = this.field('Amount received')

  async pay(amount: string) {
    await this.amount.fill(amount)
    await this.button('Save payment').click()
  }
}
