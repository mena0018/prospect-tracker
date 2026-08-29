import type { Contact } from '@/db/schema'
import type { ContactFormValues } from '@/modules/contacts/contacts-schema'

// Same shape as the opportunity form: every field is a string, converted back at the edge.
// See docs/reference/opportunity-form.md
export function toContactFormValues(contact: Contact | null): ContactFormValues {
  const text = (value: string | null | undefined) => value ?? ''

  return {
    firstName: text(contact?.firstName),
    lastName: text(contact?.lastName),
    company: text(contact?.company),
    jobTitle: text(contact?.jobTitle),
    city: text(contact?.city),
    // One empty row so the field is never an invisible "add" button on a new contact.
    emails: contact?.emails.length ? [...contact.emails] : [''],
    phones: contact?.phones.length ? [...contact.phones] : [''],
    linkedinUrl: text(contact?.linkedinUrl),
    relationship: contact?.relationship ?? 'other',
    notes: text(contact?.notes)
  }
}
