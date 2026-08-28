import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import { ContactIdentity } from '@/modules/contacts/components/contact-identity'
import { RelationshipBadge } from '@/modules/contacts/components/relationship-badge'
import { ContactPicker } from '@/modules/contacts/components/contact-picker'
import type { LinkedContact } from '@/modules/contacts/contacts-types'

type Props = {
  contacts: LinkedContact[]
  onLink: (contact: LinkedContact) => void
  onUnlink: (contactId: string) => void
  onCreateNew: () => void
}

// Order carries meaning: the first row is the contact who pitched, and it is what the tracker
// column shows — see docs/reference/contacts.md
export function LinkedContactsField({ contacts, onLink, onUnlink, onCreateNew }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {contacts.length === 0 ? (
        <p className="text-muted-foreground border-border-soft rounded-lg border border-dashed px-3.5 py-4 text-center text-xs">
          {m.contact_noneLinked()}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {contacts.map((contact, index) => (
            <li
              key={contact.id}
              className={cn(
                'border-border-soft flex items-center gap-3 rounded-lg border px-3 py-2',
                index === 0 && 'bg-accent/35'
              )}
            >
              <ContactIdentity contact={contact} className="grow" />

              {index === 0 ? (
                <span className="text-muted-foreground text-2xs flex-none font-semibold uppercase">
                  {m.contact_primaryBadge()}
                </span>
              ) : null}

              <RelationshipBadge relationship={contact.relationship} className="flex-none" />

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={m.contact_unlink()}
                onClick={() => onUnlink(contact.id)}
                className="text-muted-foreground hover:text-destructive flex-none"
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ContactPicker
        linkedIds={contacts.map((contact) => contact.id)}
        onPick={onLink}
        onCreateNew={onCreateNew}
      />
    </div>
  )
}
