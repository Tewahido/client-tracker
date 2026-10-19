import { ArrowRight, BellRing, CalendarCheck, HandCoins } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button, SelectInput, TextInput } from '../../../../components/ui'
import { periodLabel } from '../../../../lib/describe'
import { currencySymbol } from '../../../../lib/money'
import { useLendingDefaults } from '../../../../hooks/useLendingDefaults'
import { TRY_IT_TERMS, useTryItCalculator } from '../../hooks/useTryItCalculator'
import { tryItStyles as s } from './TryItCalculator.styles'

/** Interactive preview: play with a loan and see what Lendly would track and when it would remind you. */
export function TryItCalculator({ onStart }: { onStart: () => void }) {
  const { amount, setAmount, interest, setInterest, termDays, setTermDays, result } = useTryItCalculator()
  const { defaults } = useLendingDefaults()

  return (
    <section id="try-it" className={s.root} aria-labelledby="try-title">
      <div className={s.grid}>
        <div>
          <p className={s.eyebrow}>Try it</p>
          <h2 id="try-title" className={s.title}>
            See a loan the Lendly way
          </h2>
          <p className={s.lead}>Change the numbers. This is exactly what Lendly would track for you, and when it would give you a nudge.</p>
          <div className={s.form}>
            <TextInput
              label="Amount lent"
              inputMode="decimal"
              prefix={currencySymbol(defaults.currency)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <TextInput label="Interest %" inputMode="decimal" value={interest} onChange={(e) => setInterest(e.target.value)} />
            <SelectInput label="Pay back in" value={termDays} onChange={(e) => setTermDays(Number(e.target.value))}>
              {TRY_IT_TERMS.map((d) => (
                <option key={d} value={d}>
                  {periodLabel(d)}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>

        <motion.div
          className={s.result}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          aria-live="polite"
        >
          <div className={s.resultPattern} />
          <div className={s.resultBody}>
            {result ? (
              <>
                <div className={s.resultLabel}>They'll pay you back</div>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={result.total}
                    className={s.resultTotal}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                    {result.total}
                  </motion.div>
                </AnimatePresence>
                <div className={s.resultSub}>Including {result.interest} interest</div>
                <ul className={s.timeline}>
                  <li className={s.event}>
                    <HandCoins className={s.eventIcon} /> Lent today
                  </li>
                  <li className={s.event}>
                    <BellRing className={s.eventIcon} /> Lendly reminds you <span className={s.eventWhen}>{result.remindOn}</span>
                  </li>
                  <li className={s.event}>
                    <CalendarCheck className={s.eventIcon} /> Payment due <span className={s.eventWhen}>{result.dueOn}</span>
                  </li>
                </ul>
              </>
            ) : (
              <p className={s.invalid}>Enter an amount and an interest rate between 0 and 1000%.</p>
            )}
            <div className={s.cta}>
              <Button variant="inverse" size="lg" trailingIcon={ArrowRight} onClick={onStart}>
                Track a real loan
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
