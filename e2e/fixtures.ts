import { test as base } from '@playwright/test'
import { AppPage } from './pages/AppPage'
import { LoanDetailDialog } from './pages/LoanDetailDialog'
import { LoanFormDialog } from './pages/LoanFormDialog'
import { LoansPage } from './pages/LoansPage'
import { PaymentDialog } from './pages/PaymentDialog'
import { SettingsPage } from './pages/SettingsPage'

interface PageObjects {
  app: AppPage
  loans: LoansPage
  settings: SettingsPage
  loanForm: LoanFormDialog
  loanDetail: LoanDetailDialog
  payment: PaymentDialog
}

/**
 * `test` with every page object ready to use; each test starts with an empty app.
 * (The fixture callback is named `provide` rather than Playwright's usual `use` so the
 * React hooks lint rule doesn't mistake it for React's `use` hook.)
 */
export const test = base.extend<PageObjects>({
  app: async ({ page }, provide) => provide(new AppPage(page)),
  loans: async ({ page }, provide) => provide(new LoansPage(page)),
  settings: async ({ page }, provide) => provide(new SettingsPage(page)),
  loanForm: async ({ page }, provide) => provide(new LoanFormDialog(page)),
  loanDetail: async ({ page }, provide) => provide(new LoanDetailDialog(page)),
  payment: async ({ page }, provide) => provide(new PaymentDialog(page)),
})

export { expect } from '@playwright/test'
