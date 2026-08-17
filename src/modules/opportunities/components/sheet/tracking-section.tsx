import { withForm } from '@/components/form/form-hook'
import { SheetFormSection } from '@/components/ui/sheet-form'
import { m } from '@/i18n/paraglide/messages'
import type { Stage } from '@/db/schema'
import { EMPTY_FORM_VALUES, GRID } from '@/modules/opportunities/components/sheet/form-layout'
import { StagePicker } from '@/modules/stages/components/stage-picker'
import { NOTES_MAX_LENGTH } from '@/modules/opportunities/opportunities-schema'
import {
  notesRemaining,
  notesRemainingHint,
  notesRemainingTone
} from '@/modules/opportunities/utils/display'
import { cn } from '@/lib/utils'

export const TrackingSection = withForm({
  defaultValues: EMPTY_FORM_VALUES,
  props: { stages: [] as Stage[] },
  render: function Render({ form, stages }) {
    return (
      <SheetFormSection title={m.opportunity_sectionTracking()}>
        <div className="flex flex-col gap-3.5">
          <form.AppField name="stageId">
            {(field) => (
              <field.RadioGroupField label={m.opportunity_stageLabel()}>
                {(control) => <StagePicker {...control} stages={stages} />}
              </field.RadioGroupField>
            )}
          </form.AppField>

          <div className={GRID}>
            <form.AppField name="lastContactAt">
              {(field) => (
                <field.TextInputField
                  size="form"
                  label={m.opportunity_lastContactLabel()}
                  type="date"
                />
              )}
            </form.AppField>

            <form.AppField name="nextReminderAt">
              {(field) => (
                <field.TextInputField
                  size="form"
                  label={m.opportunity_nextReminderLabel()}
                  type="date"
                  hint={
                    field.state.value
                      ? m.opportunity_nextReminderSet()
                      : m.opportunity_nextReminderHint()
                  }
                />
              )}
            </form.AppField>
          </div>

          <form.AppField name="notes">
            {(field) => {
              const remaining = notesRemaining(field.state.value)

              return (
                <field.TextareaField
                  maxLength={NOTES_MAX_LENGTH}
                  label={m.opportunity_notesLabel()}
                  placeholder={m.opportunity_notesPlaceholder()}
                  hint={notesRemainingHint(remaining)}
                  hintClassName={cn('text-right', notesRemainingTone(remaining))}
                />
              )
            }}
          </form.AppField>
        </div>
      </SheetFormSection>
    )
  }
})
