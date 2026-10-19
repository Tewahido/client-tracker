import { useMemo, useState } from 'react'
import { useMoney } from '../../../hooks/useMoney'
import { useToday } from '../../../hooks/useToday'
import { formatDate } from '../../../lib/dates'
import { previewLoan } from '../../../lib/loanPreview'
import { parseMoney } from '../../../lib/money'

export const TRY_IT_TERMS = [7, 14, 30, 60, 90]

/** State and derived figures for the landing page's "try it" loan calculator. */
export function useTryItCalculator() {
  const [amount, setAmount] = useState('1500')
  const [interest, setInterest] = useState('10')
  const [termDays, setTermDays] = useState(30)
  const money = useMoney()
  const today = useToday()

  const result = useMemo(() => {
    const principalCents = parseMoney(amount)
    const rate = Number(interest || 0)
    if (!principalCents || !Number.isFinite(rate) || rate < 0 || rate > 1000) return null
    const p = previewLoan({ principalCents, interestRate: rate, termDays, lentOn: today })
    return {
      total: money(p.totalDueCents),
      interest: money(p.interestCents),
      dueOn: formatDate(p.dueOn, 'EEE d MMM'),
      remindOn: formatDate(p.firstReminderOn, 'EEE d MMM'),
    }
  }, [amount, interest, termDays, money, today])

  return { amount, setAmount, interest, setInterest, termDays, setTermDays, result }
}
