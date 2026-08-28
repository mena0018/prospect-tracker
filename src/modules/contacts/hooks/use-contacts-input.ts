import { useSearch } from '@tanstack/react-router'

import { Route } from '@/routes/_authed/app.contacts.index'
import { toContactsInput } from '@/modules/contacts/utils/search-input'
import type { GetContactsInput } from '@/modules/contacts/contacts-schema'

// See docs/reference/server-side-table.md
export function useContactsInput(): GetContactsInput {
  return toContactsInput(useSearch({ from: Route.id }))
}
