import { withForm } from '@/components/form/form-hook'
import { SheetFormSection } from '@/components/sheet-form'
import { m } from '@/i18n/paraglide/messages'
import type { ExperienceLevel, JobType } from '@/db/schema'
import {
  EMPTY_FORM_VALUES,
  FULL_WIDTH,
  GRID
} from '@/modules/opportunities/components/sheet/form-layout'
import { ONSITE_DAYS_OPTIONS } from '@/modules/opportunities/utils/display'

export const MissionSection = withForm({
  defaultValues: EMPTY_FORM_VALUES,
  props: {
    jobTypes: [] as JobType[],
    experienceLevels: [] as ExperienceLevel[]
  },
  render: function Render({ form, jobTypes, experienceLevels }) {
    return (
      <SheetFormSection title={m.opportunity_sectionMission()}>
        <div className={GRID}>
          <form.AppField name="need">
            {(field) => (
              <field.TextInputField
                size="form"
                label={m.opportunity_needLabel()}
                placeholder={m.opportunity_needPlaceholder()}
                className={FULL_WIDTH}
              />
            )}
          </form.AppField>

          <form.AppField name="jobTypeId">
            {(field) => (
              <field.SelectField
                label={m.opportunity_jobTypeLabel()}
                options={jobTypes}
                placeholder={m.opportunity_notSpecified()}
                clearLabel={m.opportunity_notSpecified()}
              />
            )}
          </form.AppField>

          <form.AppField name="experienceId">
            {(field) => (
              <field.SelectField
                label={m.opportunity_experienceLabel()}
                options={experienceLevels}
                placeholder={m.opportunity_notSpecified()}
                clearLabel={m.opportunity_notSpecified()}
              />
            )}
          </form.AppField>

          <form.AppField name="dailyRate">
            {(field) => (
              <field.TextInputField
                size="form"
                label={m.opportunity_dailyRateLabel()}
                placeholder={m.opportunity_dailyRatePlaceholder()}
                inputMode="numeric"
                suffix={m.opportunity_dailyRateUnit()}
                tabular
              />
            )}
          </form.AppField>

          <form.AppField name="onsiteDays">
            {(field) => (
              <field.SelectField
                label={m.opportunity_onsiteDaysLabel()}
                options={ONSITE_DAYS_OPTIONS()}
                placeholder={m.opportunity_notSpecified()}
                clearLabel={m.opportunity_notSpecified()}
              />
            )}
          </form.AppField>

          <form.AppField name="location">
            {(field) => (
              <field.TextInputField
                size="form"
                label={m.opportunity_locationLabel()}
                placeholder={m.opportunity_locationPlaceholder()}
              />
            )}
          </form.AppField>
        </div>
      </SheetFormSection>
    )
  }
})
