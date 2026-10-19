import { Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { Avatar, Button, ConfirmDialog, Modal } from '../../../../components/ui'
import { useMoney } from '../../../../hooks/useMoney'
import { usePermissions } from '../../../../hooks/usePermissions'
import { LoanRow } from '../../../loans'
import { usePersonDetail } from '../../hooks/usePersonDetail'
import { OnTimeRating } from '../PersonCard'
import { personDetailStyles as s } from './PersonDetailModal.styles'

interface PersonDetailModalProps {
  borrowerId: string
  onClose: () => void
  onEdit: () => void
  onNewLoan: () => void
  onOpenLoan: (loanId: string) => void
}

export function PersonDetailModal({ borrowerId, onClose, onEdit, onNewLoan, onOpenLoan }: PersonDetailModalProps) {
  const { summary, loans, confirmDelete, setConfirmDelete, remove } = usePersonDetail(borrowerId)
  const money = useMoney()
  const { canEdit, isOwner } = usePermissions()

  if (!summary) return null
  const { borrower, stats } = summary

  return (
    <>
      <Modal open onClose={onClose} title="Person" wide>
        <div className={s.header}>
          <Avatar name={borrower.name} size="lg" />
          <div className={s.identity}>
            <div className={s.name}>{borrower.name}</div>
            <div className={s.contacts}>
              {borrower.phone && (
                <a className={s.contact} href={`tel:${borrower.phone}`}>
                  <Phone className={s.contactIcon} />
                  {borrower.phone}
                </a>
              )}
              {borrower.email && (
                <a className={s.contact} href={`mailto:${borrower.email}`}>
                  <Mail className={s.contactIcon} />
                  {borrower.email}
                </a>
              )}
            </div>
          </div>
          <OnTimeRating rate={stats.onTimeRate} />
        </div>

        <div className={s.stats}>
          <div className={s.stat}>
            <div className={s.statLabel}>Owes you</div>
            <div className={s.statValue}>{money(stats.outstandingCents)}</div>
          </div>
          <div className={s.stat}>
            <div className={s.statLabel}>Lent in total</div>
            <div className={s.statValue}>{money(stats.lentCents)}</div>
          </div>
          <div className={s.stat}>
            <div className={s.statLabel}>Loans</div>
            <div className={s.statValue}>
              {stats.openLoans} open · {stats.settledLoans} done
            </div>
          </div>
        </div>

        {borrower.notes && <p className={s.notes}>{borrower.notes}</p>}

        <div className={s.section}>
          <div className={s.sectionHead}>
            <span className={s.sectionTitle}>Loans</span>
            {canEdit && (
              <Button size="sm" icon={Plus} onClick={onNewLoan}>
                New loan
              </Button>
            )}
          </div>
          {loans.length === 0 ? (
            <p className={s.empty}>No loans with {borrower.name} yet.</p>
          ) : (
            <div className={s.list}>
              {loans.map((view) => (
                <LoanRow key={view.loan.id} view={view} hideBorrower onOpen={() => onOpenLoan(view.loan.id)} />
              ))}
            </div>
          )}
        </div>

        {canEdit && (
          <div className={s.footer}>
            <Button variant="secondary" size="sm" icon={Pencil} onClick={onEdit}>
              Edit details
            </Button>
            {isOwner && (
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirmDelete(true)}>
                Remove
              </Button>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title={`Remove ${borrower.name}?`}
        message={
          loans.length
            ? `This also deletes their ${loans.length} ${loans.length === 1 ? 'loan' : 'loans'} and all payment history.`
            : 'They have no loans, so nothing else is affected.'
        }
        confirmLabel="Remove"
        danger
        onConfirm={async () => {
          await remove()
          onClose()
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  )
}
