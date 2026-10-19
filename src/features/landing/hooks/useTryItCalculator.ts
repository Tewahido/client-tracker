import { useMemo, useState } from 'react'
import { useMoney } from '../../../hooks/useMoney'
import { useToday } from '../../../hooks/useToday'
import { formatDate } from '../../../lib/dates'
import { previewLoan, tryItProblem } from '../../../lib/loanPreview'
import { parseMoney } from '../../../lib/money'
import { useSettings } from '../../../providers/settingsContext'

export const TRY_IT_TERMS = [7, 14, 30, 60, 90]

const DAY = 'EEE d MMM'

/** State and derived figures for the landing page's "try it" loan calculator. */
export function useTryItCalculator() {
  const [amount, setAmount] = useState('1500')
  const [interest, setInterest] = useState('10')
  const [termDays, setTermDays] = useState(30)
  const money = useMoney()
  const today = useToday()
  const { reminderDays } = useSettings().settings

  const { result, problem } = useMemo(() => {
    const principalCents = parseMoney(amount)
    const rate = Number(interest || 0)
    const problem = tryItProblem(principalCents, rate)
    if (problem || principalCents === null) return { result: null, problem }
    const p = previewLoan({ principalCents, interestRate: rate, termDays, lentOn: today, reminderDays })
    return {
      problem: null,
      result: {
        total: money(p.totalDueCents),
        interest: money(p.interestCents),
        lentOn: formatDate(today, DAY),
        dueOn: formatDate(p.dueOn, DAY),
        remindOn: formatDate(p.firstReminderOn, DAY),
      },
    }
  }, [amount, interest, termDays, money, today, reminderDays])

  return { amount, setAmount, interest, setInterest, termDays, setTermDays, result, problem }
}
