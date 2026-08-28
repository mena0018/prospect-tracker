import type { ContactRelationship } from '@/db/schema'

// The subset of a contact every surface needs to render one: the tracker column, the picker
// and the linked rows in the opportunity sheet. The full record lives on the contacts page.
export type LinkedContact = {
  id: string
  firstName: string | null
  lastName: string | null
  company: string | null
  jobTitle: string | null
  relationship: ContactRelationship
}
