import type { Page } from '@playwright/test'
import { Dialog } from './Dialog'

/** The "Person" dialog: what someone owes, their loans and how reliably they pay. */
export class PersonDialog extends Dialog {
  constructor(page: Page) {
    super(page, 'Person')
  }

  /** Their record with monthly instalments, e.g. "2 missed instalments · 1 paid late". */
  readonly instalmentHistory = this.root.getByText(/missed instalment|paid late/)
}
