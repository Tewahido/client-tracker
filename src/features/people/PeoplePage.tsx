import { UserPlus, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { useOverlay } from '../../app/overlayContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button, Card, EmptyState, SearchInput } from '../../components/ui'
import { PersonCard } from './components/PersonCard'
import { usePeopleList } from './hooks/usePeople'
import { peoplePageStyles as s } from './PeoplePage.styles'

export function PeoplePage() {
  const { people, total, query, setQuery } = usePeopleList()
  const overlay = useOverlay()
  const addPerson = () => overlay.open({ type: 'person-form' })

  return (
    <>
      <PageHeader
        eyebrow="Your circle"
        title="People"
        subtitle={total ? `${total} ${total === 1 ? 'person' : 'people'} you've lent to` : undefined}
        actions={
          <Button icon={UserPlus} variant="secondary" onClick={addPerson}>
            Add person
          </Button>
        }
      />

      {total === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No one here yet"
            description="Add the people you lend money to. You can also add someone while recording a loan."
            action={
              <Button icon={UserPlus} onClick={addPerson}>
                Add your first person
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className={s.toolbar}>
            <SearchInput value={query} onChange={setQuery} placeholder="Search by name, phone or email" />
          </div>
          {people.length === 0 ? (
            <p className={s.noResults}>Nobody matches "{query}".</p>
          ) : (
            <div className={s.grid}>
              {people.map((person, i) => (
                <motion.div key={person.borrower.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
                  <PersonCard person={person} onOpen={() => overlay.open({ type: 'person', borrowerId: person.borrower.id })} />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
