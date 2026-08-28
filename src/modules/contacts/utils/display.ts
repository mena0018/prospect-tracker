import type { Contact, ContactRelationship, StageColorToken } from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import { CONTACT_SORT_COLUMNS, type ContactSortColumn } from '@/modules/contacts/contacts-schema'
import { CONTACT_RELATIONSHIPS } from '@/db/schema'
import { stageColorVar } from '@/modules/stages/stages-utils'
import type { LinkedContact } from '@/modules/contacts/contacts-types'

export function toContactSortColumn(value: string): ContactSortColumn | null {
  return CONTACT_SORT_COLUMNS.find((column) => column === value) ?? null
}

// '' is the filter's off state, so it is a valid value here and not a parse failure.
export function toRelationshipFilter(value: string | null): ContactRelationship | '' {
  return CONTACT_RELATIONSHIPS.find((entry) => entry === value) ?? ''
}

type Nameable = Pick<Contact, 'firstName' | 'lastName' | 'company'>

// A contact always has at least one of the three — the `contacts_identified` check guarantees it,
// so this never returns an empty string for a stored row.
export function contactDisplayName(contact: Nameable) {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim()

  return name || contact.company || ''
}

// Initials follow the same fallback: a company-only contact gets the company's first letters.
export function contactInitials(contact: Nameable) {
  const parts = [contact.firstName, contact.lastName].filter(Boolean)
  const source = parts.length > 0 ? parts : (contact.company ?? '').split(/\s+/).filter(Boolean)

  return source
    .slice(0, 2)
    .map((part) => (part ?? '').charAt(0).toUpperCase())
    .join('')
}

// Built per call so the labels follow the active locale.
export function relationshipLabel(relationship: ContactRelationship) {
  switch (relationship) {
    case 'esn_manager':
      return m.contact_relationshipEsnManager()
    case 'end_client':
      return m.contact_relationshipEndClient()
    case 'freelance':
      return m.contact_relationshipFreelance()
    case 'other':
      return m.contact_relationshipOther()
  }
}

export const RELATIONSHIP_OPTIONS = () =>
  (['esn_manager', 'end_client', 'freelance', 'other'] as const).map((id) => ({
    id,
    name: relationshipLabel(id)
  }))

// One token per relationship, reusing the stage palette rather than a second set of colours.
// Consumed as `--stage-dot`, the same variable StageBadge drives — see src/styles/globals.css
const RELATIONSHIP_COLOR: Record<ContactRelationship, StageColorToken> = {
  esn_manager: 'blue',
  end_client: 'green',
  freelance: 'violet',
  other: 'slate'
}

export function relationshipColorVar(relationship: ContactRelationship) {
  return stageColorVar(RELATIONSHIP_COLOR[relationship])
}

// The tracker column shows the contact who pitched, and how many others came with them.
export function primaryContact(contacts: LinkedContact[]) {
  return contacts[0] ?? null
}
