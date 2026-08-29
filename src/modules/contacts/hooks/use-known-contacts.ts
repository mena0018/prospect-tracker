import { useCallback, useState } from 'react'

import type { LinkedContact } from '@/modules/contacts/contacts-types'

// The opportunity form holds contact ids; rendering them as names needs the records. They come
// from two places — the row being edited already carries its linked contacts, and the picker
// returns full records for anything newly linked. Both land here.
export function useKnownContacts(seed: LinkedContact[]) {
  const [added, setAdded] = useState<LinkedContact[]>([])

  const remember = useCallback((contact: LinkedContact) => {
    setAdded((current) =>
      current.some((entry) => entry.id === contact.id) ? current : [...current, contact]
    )
  }, [])

  const byId = new Map<string, LinkedContact>()
  for (const contact of [...seed, ...added]) byId.set(contact.id, contact)

  return { knownContacts: [...byId.values()], remember }
}
