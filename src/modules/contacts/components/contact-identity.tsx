import { cn } from '@/lib/utils'
import type { Contact } from '@/db/schema'
import { contactDisplayName, contactInitials } from '@/modules/contacts/utils/display'

type Props = {
  contact: Pick<Contact, 'firstName' | 'lastName' | 'company' | 'jobTitle'>
  className?: string
  // The list shows the job title under the name; the picker has no room for it.
  showSubtitle?: boolean
}

// Name plus initials medallion, shared by the contacts list, the picker and the linked chips.
export function ContactIdentity({ contact, className, showSubtitle = true }: Props) {
  const name = contactDisplayName(contact)
  const subtitle = [contact.jobTitle, contact.company].filter(Boolean).join(' · ')

  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span className="bg-secondary text-secondary-foreground text-2xs flex size-7 flex-none items-center justify-center rounded-full font-semibold">
        {contactInitials(contact)}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-semibold">{name}</span>
        {showSubtitle && subtitle ? (
          <span className="text-muted-foreground truncate text-xs">{subtitle}</span>
        ) : null}
      </span>
    </span>
  )
}
