import { useState } from 'react'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  SheetFormBody,
  SheetFormDiscardDialog,
  SheetFormFooter,
  SheetFormHeader
} from '@/components/sheet-form'
import type { ExperienceLevel, JobType, Stage } from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import { ContactSection } from '@/modules/opportunities/components/sheet/contact-section'
import { MissionSection } from '@/modules/opportunities/components/sheet/mission-section'
import { TrackingSection } from '@/modules/opportunities/components/sheet/tracking-section'
import { useOpportunityForm } from '@/modules/opportunities/hooks/use-opportunity-form'
import type { opportunityFormSchema } from '@/modules/opportunities/opportunities-schema'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'
import { selectableStages } from '@/modules/stages/stages-utils'
import { Button } from '@/components/ui/button'

const FORM_ID = 'opportunity-form'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: OpportunityRow | null
  stages: Stage[]
  jobTypes: JobType[]
  experienceLevels: ExperienceLevel[]
  onSubmit: (values: ReturnType<typeof opportunityFormSchema.parse>) => Promise<void>
}

export function OpportunitySheet({
  open,
  onOpenChange,
  row,
  stages,
  jobTypes,
  experienceLevels,
  onSubmit
}: Props) {
  const isEdit = row !== null
  const [isConfirmingDiscard, setConfirmingDiscard] = useState(false)

  const offered = selectableStages(stages, row?.stageId)

  const { form, discard } = useOpportunityForm({
    open,
    row,
    // Both come from the same stage — the one a new opportunity starts in. Picking another stage
    // re-derives the reminder from that stage's own delay.
    fallbackStageId: offered[0]?.id ?? '',
    reminderDelayDays: offered[0]?.reminderDelayDays ?? 0,
    onSubmit
  })

  const requestClose = () => {
    // Same signal as the save button, so the two can never disagree — `isDirty` would latch.
    const needsConfirm = !form.state.isDefaultValue && !form.state.isSubmitting

    if (needsConfirm) setConfirmingDiscard(true)
    else onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) requestClose()
      }}
    >
      <SheetContent
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-145"
      >
        <SheetFormHeader
          icon={isEdit ? 'pencil' : 'plus'}
          title={isEdit ? m.opportunity_editTitle() : m.opportunity_createTitle()}
          description={isEdit ? m.opportunity_editDescription() : m.opportunity_createDescription()}
          onClose={requestClose}
        />

        <SheetFormBody
          id={FORM_ID}
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit().catch(() => {})
          }}
        >
          <ContactSection form={form} />
          <MissionSection form={form} jobTypes={jobTypes} experienceLevels={experienceLevels} />
          <TrackingSection form={form} stages={offered} />
        </SheetFormBody>

        <SheetFormFooter
          primaryCta={
            <form.AppForm>
              <form.SubmitButton
                formId={FORM_ID}
                requiresChanges
                label={isEdit ? m.common_save() : m.opportunity_createSubmit()}
              />
            </form.AppForm>
          }
          secondaryCta={
            <Button variant="outline" onClick={requestClose}>
              {m.common_cancel()}
            </Button>
          }
        />
      </SheetContent>

      <SheetFormDiscardDialog
        open={isConfirmingDiscard}
        onOpenChange={setConfirmingDiscard}
        title={m.opportunity_discardTitle()}
        description={m.opportunity_discardDescription()}
        confirmLabel={m.opportunity_discardConfirm()}
        onConfirm={() => {
          setConfirmingDiscard(false)
          discard()
          onOpenChange(false)
        }}
      />
    </Sheet>
  )
}
