import { withForm } from '@/components/form/form-hook'
import { SheetFormSection } from '@/components/sheet-form'
import { m } from '@/i18n/paraglide/messages'
import type { Stage } from '@/db/schema'
import { EMPTY_FORM_VALUES, GRID } from '@/modules/opportunities/components/sheet/form-layout'
import { StagePicker } from '@/modules/stages/components/stage-picker'
import { NOTES_MAX_LENGTH } from '@/modules/opportunities/opportunities-schema'
import { isAutomaticReminder, suggestedReminder } from '@/modules/opportunities/utils/form-values'
import {
  highlightClasses,
  useFieldHighlight
} from '@/modules/opportunities/hooks/use-field-highlight'
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
    const { isHighlighted, highlight } = useFieldHighlight()

    // Always re-derived, even over a stored date — see docs/reference/opportunity-form.md
    const syncReminder = (stageId: string, lastContactAt: string) => {
      const delay = stages.find((stage) => stage.id === stageId)?.reminderDelayDays
      if (!delay || !lastContactAt) return

      form.setFieldValue('nextReminderAt', suggestedReminder(lastContactAt, delay))
      highlight()
    }

    return (
      <SheetFormSection title={m.opportunity_sectionTracking()}>
        <div className="flex flex-col gap-3.5">
          <form.AppField
            name="stageId"
            listeners={{
              onChange: ({ value }) => syncReminder(value, form.state.values.lastContactAt)
            }}
          >
            {(field) => (
              <field.RadioGroupField label={m.opportunity_stageLabel()}>
                {(control) => <StagePicker {...control} stages={stages} />}
              </field.RadioGroupField>
            )}
          </form.AppField>

          <div className={GRID}>
            <form.AppField
              name="lastContactAt"
              listeners={{
                onChange: ({ value }) => syncReminder(form.state.values.stageId, value)
              }}
            >
              {(field) => (
                <field.TextInputField
                  size="form"
                  label={m.opportunity_lastContactLabel()}
                  type="date"
                />
              )}
            </form.AppField>

            <form.Subscribe
              selector={(state) => [state.values.stageId, state.values.lastContactAt] as const}
            >
              {([stageId, lastContactAt]) => {
                const delayDays = stages.find((stage) => stage.id === stageId)?.reminderDelayDays

                return (
                  <form.AppField name="nextReminderAt">
                    {(field) => (
                      <field.TextInputField
                        size="form"
                        label={m.opportunity_nextReminderLabel()}
                        type="date"
                        className={cn(
                          '[&_input]:transition-[box-shadow,background-color,border-color]',
                          highlightClasses(isHighlighted)
                        )}
                        hint={
                          delayDays &&
                          isAutomaticReminder(field.state.value, lastContactAt, delayDays)
                            ? m.opportunity_nextReminderAuto({ days: delayDays })
                            : m.opportunity_nextReminderHint()
                        }
                      />
                    )}
                  </form.AppField>
                )
              }}
            </form.Subscribe>
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
