import { cn } from '../../../../lib/cn'
import { ArrowDownLeft, CalendarPlus, Check, HandHeart, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar, Button, ConfirmDialog, Modal, ProgressRing, STATUS_META, StatusBadge } from '../../../../components/ui'
import { useMoney } from '../../../../hooks/useMoney'
import { usePermissions } from '../../../../hooks/usePermissions'
import { formatDate } from '../../../../lib/dates'
import { dueLabel } from '../../../../lib/describe'
import { isOpen } from '../../../../lib/loans'
import { useLoanDetail } from '../../hooks/useLoanDetail'
import { loanDetailStyles as s } from './LoanDetailModal.styles'

interface LoanDetailModalProps {
  loanId: string
  onClose: () => void
  onEdit: () => void
  onRecordPayment: () => void
  onOpenPerson: (borrowerId: string) => void
  /** Extra actions contributed by other features (e.g. reminders). */
  extraActions?: ReactNode
}

const EXTENSIONS = [
  { label: '+1 week', days: 7 },
  { label: '+2 weeks', days: 14 },
  { label: '+1 month', days: 30 },
]

export function LoanDetailModal({ loanId, onClose, onEdit, onRecordPayment, onOpenPerson, extraActions }: LoanDetailModalProps) {
  const { view, actions, confirm, setConfirm, closeConfirm, busy, run } = useLoanDetail(loanId)
  const money = useMoney()
  const { canEdit, isOwner, canDeletePayment } = usePermissions()

  // The loan was deleted (possibly from this dialog): nothing left to show.
  if (!view) return null

  const { loan, borrower, status } = view
  const open = isOpen(status)
  const name = borrower?.name ?? 'Unknown'

  return (
    <>
      <Modal open onClose={onClose} title="Loan details" wide>
        <div className={s.who}>
          <button className={s.whoButton} onClick={() => onOpenPerson(loan.borrowerId)}>
            <Avatar name={name} />
            <div className={s.whoText}>
              <div className={s.whoName}>{name}</div>
              <div className={s.whoSub}>View all their loans</div>
            </div>
          </button>
          <StatusBadge status={status} />
        </div>

        <div className={s.hero}>
          <ProgressRing value={view.progress} size={88} stroke={8} colorClass={STATUS_META[status].stroke} />
          <div>
            <div className={s.heroLabel}>{open ? 'Still owed' : status === 'paid' ? 'Fully repaid' : 'Forgiven'}</div>
            <div className={cn(s.heroValue, !open && s.heroValueDone)}>{money(open ? view.balanceCents : view.totalDueCents)}</div>
            <div className={s.heroSub}>
              {money(view.paidCents)} of {money(view.totalDueCents)} paid back
            </div>
          </div>
        </div>

        <div className={s.facts}>
          <Fact label="Lent" value={money(loan.principalCents)} />
          <Fact label="Interest" value={loan.interestRate ? `${loan.interestRate}%` : 'None'} />
          <Fact label="Lent on" value={formatDate(loan.lentOn)} />
          <Fact label="Due" value={formatDate(loan.dueOn)} sub={dueLabel(view)} urgent={status === 'overdue'} />
        </div>

        {loan.note && <p className={s.note}>{loan.note}</p>}

        {open && canEdit && (
          <div className={s.primaryActions}>
            <Button icon={Plus} size="lg" onClick={onRecordPayment}>
              Record payment
            </Button>
            <Button icon={Check} size="lg" variant="secondary" loading={busy === 'paid'} onClick={() => run('paid', actions.markPaidInFull)}>
              Mark fully paid
            </Button>
          </div>
        )}

        {extraActions && <div className={s.section}>{extraActions}</div>}

        {open && canEdit && (
          <div className={s.section}>
            <div className={s.sectionTitle}>Give more time</div>
            <div className={s.chips}>
              {EXTENSIONS.map((ext) => (
                <Button
                  key={ext.days}
                  size="sm"
                  variant="secondary"
                  icon={CalendarPlus}
                  loading={busy === `ext-${ext.days}`}
                  onClick={() => run(`ext-${ext.days}`, () => actions.extendDueDate(ext.days))}
                >
                  {ext.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className={s.section}>
          <div className={s.sectionTitle}>Payments</div>
          {view.payments.length === 0 ? (
            <p className={s.noPayments}>No payments yet.</p>
          ) : (
            <div className={s.payments}>
              {[...view.payments].reverse().map((p) => (
                <div key={p.id} className={s.payment}>
                  <span className={s.paymentIcon}>
                    <ArrowDownLeft className={s.paymentIconSvg} />
                  </span>
                  <div className={s.paymentMain}>
                    <div className={s.paymentAmount}>{money(p.amountCents)}</div>
                    <div className={s.paymentMeta}>
                      {formatDate(p.paidOn)}
                      {p.note ? ` · ${p.note}` : ''}
                    </div>
                  </div>
                  {canDeletePayment(p) && (
                    <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Remove payment" onClick={() => setConfirm({ kind: 'delete-payment', paymentId: p.id })} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {canEdit && (
          <div className={s.footer}>
            <div className={s.footerGroup}>
              <Button variant="secondary" size="sm" icon={Pencil} onClick={onEdit}>
                Edit
              </Button>
              {isOwner && open && (
                <Button variant="ghost" size="sm" icon={HandHeart} onClick={() => setConfirm({ kind: 'forgive' })}>
                  Forgive
                </Button>
              )}
              {isOwner && loan.writtenOffOn && (
                <Button variant="ghost" size="sm" icon={RotateCcw} loading={busy === 'reopen'} onClick={() => run('reopen', actions.reopen)}>
                  Reopen
                </Button>
              )}
            </div>
            {isOwner && (
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirm({ kind: 'delete' })}>
                Delete
              </Button>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirm?.kind === 'forgive'}
        title="Forgive this loan?"
        message={`${name} won't owe the remaining ${money(view.balanceCents)} any more. You can reopen it later.`}
        confirmLabel="Forgive"
        onConfirm={actions.forgive}
        onClose={closeConfirm}
      />
      <ConfirmDialog
        open={confirm?.kind === 'delete'}
        title="Delete this loan?"
        message="The loan and its payment history will be removed for good."
        confirmLabel="Delete loan"
        danger
        onConfirm={async () => {
          await actions.remove()
          onClose()
        }}
        onClose={closeConfirm}
      />
      <ConfirmDialog
        open={confirm?.kind === 'delete-payment'}
        title="Remove this payment?"
        message="The amount will be added back to what they owe."
        confirmLabel="Remove"
        danger
        onConfirm={() => (confirm?.kind === 'delete-payment' ? actions.removePayment(confirm.paymentId) : undefined)}
        onClose={closeConfirm}
      />
    </>
  )
}

function Fact({ label, value, sub, urgent }: { label: string; value: string; sub?: string; urgent?: boolean }) {
  return (
    <div className={s.fact}>
      <div className={s.factLabel}>{label}</div>
      <div className={s.factValue}>{value}</div>
      {sub && <div className={cn(s.factSub, urgent && s.factUrgent)}>{sub}</div>}
    </div>
  )
}
