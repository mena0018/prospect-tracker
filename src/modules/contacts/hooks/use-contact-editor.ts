import { useCallback, useState } from 'react'

import type { Contact } from '@/db/schema'
import type { CreateContactInput } from '@/modules/contacts/contacts-schema'
import { useContactMutations } from '@/modules/contacts/hooks/use-contact-mutations'

// A `null` contact means create.
type EditorState = { contact: Contact | null } | null

export function useContactEditor() {
  const [editor, setEditor] = useState<EditorState>(null)
  const [deleting, setDeleting] = useState<Contact | null>(null)
  const { create, update, remove } = useContactMutations()

  const openCreate = useCallback(() => setEditor({ contact: null }), [])
  const openEdit = useCallback((contact: Contact) => setEditor({ contact }), [])
  const closeEditor = useCallback(() => setEditor(null), [])

  // Returns the saved record so a caller creating a contact mid-flow can link it straight away.
  const submit = useCallback(
    async (values: CreateContactInput) => {
      const editing = editor?.contact

      // Rethrows on purpose: the sheet stays open with whatever was typed, toast via onError.
      const saved = editing
        ? await update.mutateAsync({ id: editing.id, ...values })
        : await create.mutateAsync(values)

      setEditor(null)

      return saved
    },
    [create, editor, update]
  )

  // Reports whether the row is really gone: the caller navigates away on success, and a failed
  // delete must leave the user on the record — the toast is the only other feedback.
  const confirmDelete = useCallback(async () => {
    if (!deleting) return false

    try {
      await remove.mutateAsync(deleting.id)
      setDeleting(null)
      setEditor(null)
      return true
    } catch {
      // Handled by the mutation's onError.
      return false
    }
  }, [deleting, remove])

  return {
    editor,
    deleting,
    isDeleting: remove.isPending,
    openCreate,
    openEdit,
    closeEditor,
    submit,
    requestDelete: setDeleting,
    cancelDelete: () => setDeleting(null),
    confirmDelete
  }
}
