import { createContext, use, useState, type PropsWithChildren } from 'react'

import { DeleteOpportunityDialog } from '@/modules/opportunities/components/delete-opportunity-dialog'
import { OpportunitySheet } from '@/modules/opportunities/components/opportunity-sheet'
import { useExperienceLevels } from '@/modules/experience-levels/use-experience-levels'
import { useJobTypes } from '@/modules/job-types/use-job-types'
import { useOpportunityEditor } from '@/modules/opportunities/hooks/use-opportunity-editor'
import { useStages } from '@/modules/stages/hooks/use-stages'

type OpportunityEditor = ReturnType<typeof useOpportunityEditor>

const OpportunityEditorContext = createContext<OpportunityEditor | null>(null)

// See docs/reference/opportunity-form.md
export function OpportunityEditorProvider({ children }: PropsWithChildren) {
  const editor = useOpportunityEditor()
  const { data: stages } = useStages()
  const { data: jobTypes } = useJobTypes()
  const { data: experienceLevels } = useExperienceLevels()
  // Kept so the title survives the dialog's exit animation.
  const [lastDeletingRecruiter, setLastDeletingRecruiter] = useState('')

  if (editor.deleting && editor.deleting.recruiter !== lastDeletingRecruiter) {
    setLastDeletingRecruiter(editor.deleting.recruiter)
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
          onSubmit={editor.submit}
        />
      ) : null}

      <DeleteOpportunityDialog
        open={editor.deleting !== null}
        onOpenChange={(next) => {
          if (!next) editor.cancelDelete()
        }}
        recruiter={editor.deleting?.recruiter ?? lastDeletingRecruiter}
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
