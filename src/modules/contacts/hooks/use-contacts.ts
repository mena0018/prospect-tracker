import { queryOptions, useQuery } from '@tanstack/react-query'

import { getContact, getContacts, searchContacts } from '@/modules/contacts/contacts-server'
import type { GetContactsInput } from '@/modules/contacts/contacts-schema'

export const CONTACTS_QUERY_KEY = ['contacts']

export const contactsQueryOptions = (input: GetContactsInput) =>
  queryOptions({
    queryKey: [...CONTACTS_QUERY_KEY, 'page', input],
    queryFn: () => getContacts({ data: input }),

    // Keeps the previous page on screen instead of unmounting the table on every paging click.
    placeholderData: (previous) => previous
  })

export function useContacts(input: GetContactsInput) {
  return useQuery(contactsQueryOptions(input))
}

export const contactQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [...CONTACTS_QUERY_KEY, 'detail', id],
    queryFn: () => getContact({ data: { id } })
  })

export function useContact(id: string) {
  return useQuery(contactQueryOptions(id))
}

// The link picker: enabled only once something is typed, so opening the sheet costs nothing.
// Previous results are kept so the list does not blink between keystrokes, but they belong to
// the old query — `isStale` lets the caller refuse to act on them. See docs/reference/contacts.md
export function useContactSearch(q: string) {
  const query = useQuery({
    queryKey: [...CONTACTS_QUERY_KEY, 'search', q],
    queryFn: () => searchContacts({ data: { q, limit: 8 } }),
    enabled: q.length > 0,
    placeholderData: (previous) => previous
  })

  return { ...query, isStale: query.isPlaceholderData }
}
