import { useState } from 'react'

import { useAppForm } from '@/components/form/form-hook'
import { contactFormSchema } from '@/modules/contacts/contacts-schema'
import { toContactFormValues } from '@/modules/contacts/utils/form-values'
import type { Contact } from '@/db/schema'

type Params = {
  open: boolean
  contact: Contact | null
  onSubmit: (values: ReturnType<typeof contactFormSchema.parse>) => Promise<void>
}

// Same shape as useOpportunityForm — see docs/reference/opportunity-form.md
export function useContactForm({ open, contact, onSubmit }: Params) {
  const form = useAppForm({
    defaultValues: toContactFormValues(contact),
    validators: { onChange: contactFormSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(contactFormSchema.parse(value))

      // Only the create draft is cleared, and only once saved — a failed submit rejects above.
      if (!contact) form.reset(toContactFormValues(null))
    }
  })

  const contactId = contact?.id ?? null
  const [loadedContactId, setLoadedContactId] = useState(contactId)

  if (open && contactId !== loadedContactId) {
    setLoadedContactId(contactId)
    form.reset(toContactFormValues(contact))
  }

  return {
    form,
    discard: () => form.reset(toContactFormValues(contact))
  }
}
