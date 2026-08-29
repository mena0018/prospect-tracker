import { useState } from 'react'
import { Plus, Search, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { m } from '@/i18n/paraglide/messages'
import { ContactIdentity } from '@/modules/contacts/components/contact-identity'
import { useContactSearch } from '@/modules/contacts/hooks/use-contacts'
import type { LinkedContact } from '@/modules/contacts/contacts-types'

type Props = {
  linkedIds: string[]
  onPick: (contact: LinkedContact) => void
  onCreateNew: () => void
}

// The most frequent gesture in the ticket, so it must be the fastest: type, then Enter on the
// first hit. Searching hits the same server fn the contacts page uses.
export function ContactPicker({ linkedIds, onPick, onCreateNew }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const { data, isFetching, isStale } = useContactSearch(query.trim())
  // Stale results belong to the previous query. Dropping them here covers every path at once —
  // Enter, click and keyboard — so none can link the person the user just stopped searching for.
  const results = isStale ? [] : (data ?? []).filter((contact) => !linkedIds.includes(contact.id))

  const pick = (contact: LinkedContact) => {
    onPick(contact)
    setQuery('')
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <PopoverTrigger
        render={<Button type="button" variant="outline" size="sm" className="h-9 w-fit gap-1.75" />}
      >
        <Plus />
        {m.contact_linkExisting()}
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 p-0">
        <div className="border-border-soft border-b p-2">
          <InputGroup className="bg-secondary h-9">
            <InputGroupAddon>
              {isFetching ? <Spinner className="size-3.75" /> : <Search className="size-3.75" />}
            </InputGroupAddon>
            <InputGroupInput
              autoFocus
              value={query}
              placeholder={m.contact_linkPlaceholder()}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                // Enter takes the first hit — the whole point of the picker. `results` is empty
                // while the previous query's rows are still showing, so this cannot fire on them.
                if (event.key !== 'Enter') return
                event.preventDefault()
                const first = results[0]
                if (first) pick(first)
              }}
            />
          </InputGroup>
        </div>

        <div className="max-h-64 overflow-y-auto p-1">
          {results.map((contact) => (
            <Button
              key={contact.id}
              type="button"
              variant="ghost"
              onClick={() => pick(contact)}
              className="h-auto w-full justify-start px-2 py-1.5 text-left font-normal"
            >
              <ContactIdentity contact={contact} />
            </Button>
          ))}

          {query.trim() && results.length === 0 && !isFetching ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-xs">
              {m.contact_linkNoResults()}
            </p>
          ) : null}
        </div>

        <div className="border-border-soft border-t p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false)
              setQuery('')
              onCreateNew()
            }}
            className="text-secondary-foreground h-8 w-full justify-start gap-2 text-xs font-medium"
          >
            <UserPlus className="size-3.5" />
            {m.contact_linkCreateNew()}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
