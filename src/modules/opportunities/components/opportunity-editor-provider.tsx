import { createContext, use, useCallback, useRef, useState, type PropsWithChildren } from 'react'

import type { LinkedContact } from '@/modules/contacts/contacts-types'
import { ContactSheet } from '@/modules/contacts/components/contact-sheet'
import { useContactEditor } from '@/modules/contacts/hooks/use-contact-editor'
import { useKnownContacts } from '@/modules/contacts/hooks/use-known-contacts'
import { DeleteOpportunityDialog } from '@/modules/opportunities/components/delete-opportunity-dialog'
import { OpportunitySheet } from '@/modules/opportunities/components/opportunity-sheet'
import { useExperienceLevels } from '@/modules/experience-levels/hooks/use-experience-levels'
import { useJobTypes } from '@/modules/job-types/hooks/use-job-types'
import { opportunityLabel } from '@/modules/opportunities/utils/display'
import { useOpportunityEditor } from '@/modules/opportunities/hooks/use-opportunity-editor'
import { useStages } from '@/modules/stages/hooks/use-stages'

type OpportunityEditor = ReturnType<typeof useOpportunityEditor>

const OpportunityEditorContext = createContext<OpportunityEditor | null>(null)

// See docs/reference/opportunity-form.md
export function OpportunityEditorProvider({ children }: PropsWithChildren) {
  const editor = useOpportunityEditor()
  // The row being edited already carries its linked contacts; the picker adds the rest.
  const { knownContacts, remember } = useKnownContacts(editor.editor?.row?.contacts ?? [])
  const contactEditor = useContactEditor()
  // Set while the opportunity sheet is open, so a contact created from it is linked, not merely
  // created — see docs/reference/contacts.md
  const linkRef = useRef<((contact: LinkedContact) => void) | null>(null)
  const registerLinker = useCallback((link: ((contact: LinkedContact) => void) | null) => {
    linkRef.current = link
  }, [])
  const { data: stages } = useStages()
  const { data: jobTypes } = useJobTypes()
  const { data: experienceLevels } = useExperienceLevels()
  // Kept so the title survives the dialog's exit animation.
  const [lastDeletingLabel, setLastDeletingLabel] = useState('')
  const deletingLabel = editor.deleting ? opportunityLabel(editor.deleting) : ''

  if (deletingLabel && deletingLabel !== lastDeletingLabel) {
    setLastDeletingLabel(deletingLabel)
  }

  return (
    <OpportunityEditorContext value={editor}>
      {children}

      {stages ? (
        <OpportunitySheet
          open={editor.editor !== null}
          onOpenChange={(next) => {
            if (!next) editor.closeEditor()
          }}
          row={editor.editor?.row ?? null}
          stages={stages}
          jobTypes={jobTypes ?? []}
          experienceLevels={experienceLevels ?? []}
          knownContacts={knownContacts}
          onCreateContact={contactEditor.openCreate}
          onRememberContact={remember}
          registerLinker={registerLinker}
          onSubmit={editor.submit}
        />
      ) : null}

      <ContactSheet
        open={contactEditor.editor !== null}
        onOpenChange={(next) => {
          if (!next) contactEditor.closeEditor()
        }}
        contact={contactEditor.editor?.contact ?? null}
        onSubmit={async (values) => {
          const isCreate = contactEditor.editor?.contact == null
          const saved = await contactEditor.submit(values)
          // A contact created from the opportunity sheet is linked straight away; editing an
          // existing one only refreshes what the form renders.
          if (isCreate && linkRef.current) linkRef.current(saved)
          else remember(saved)
        }}
      />

      <DeleteOpportunityDialog
        open={editor.deleting !== null}
        onOpenChange={(next) => {
          if (!next) editor.cancelDelete()
        }}
        label={deletingLabel || lastDeletingLabel}
        isPending={editor.isDeleting}
        onConfirm={() => void editor.confirmDelete()}
      />
    </OpportunityEditorContext>
  )
}

export function useOpportunityEditorContext() {
  const editor = use(OpportunityEditorContext)

  if (!editor) throw new Error('useOpportunityEditorContext must be used within the provider')

  return editor
}
