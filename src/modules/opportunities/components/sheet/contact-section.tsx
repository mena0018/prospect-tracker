import { withForm } from '@/components/form/form-hook'
import { SheetFormSection } from '@/components/ui/sheet-form'
import { m } from '@/i18n/paraglide/messages'
import {
  EMPTY_FORM_VALUES,
  FULL_WIDTH,
  GRID
} from '@/modules/opportunities/components/sheet/form-layout'

export const ContactSection = withForm({
  defaultValues: EMPTY_FORM_VALUES,
  render: function Render({ form }) {
    return (
      <SheetFormSection>
        <div className={GRID}>
          <form.AppField name="recruiter">
            {(field) => (
              <field.TextInputField
                size="form"
                label={m.opportunity_recruiterLabel()}
                placeholder={m.opportunity_recruiterPlaceholder()}
                required
              />
            )}
          </form.AppField>

          <form.AppField name="phone">
            {(field) => (
              <field.TextInputField
                size="form"
                label={m.opportunity_phoneLabel()}
                placeholder={m.opportunity_phonePlaceholder()}
                type="tel"
                tabular
              />
            )}
          </form.AppField>

          <form.AppField name="esn">
            {(field) => (
              <field.TextInputField
                size="form"
                label={m.opportunity_esnLabel()}
                placeholder={m.opportunity_esnPlaceholder()}
              />
            )}
          </form.AppField>

          <form.AppField name="endClient">
            {(field) => (
              <field.TextInputField
                size="form"
                label={m.opportunity_endClientLabel()}
                placeholder={m.opportunity_endClientPlaceholder()}
              />
            )}
          </form.AppField>

          <form.AppField name="offerUrl">
            {(field) => (
              <field.TextInputField
                size="form"
                label={m.opportunity_offerUrlLabel()}
                placeholder={m.opportunity_offerUrlPlaceholder()}
                type="url"
                className={FULL_WIDTH}
              />
            )}
          </form.AppField>
        </div>
      </SheetFormSection>
    )
  }
})
