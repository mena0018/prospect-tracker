import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  SheetFormBody,
  SheetFormDiscardDialog,
  SheetFormFooter,
  SheetFormHeader,
  SheetFormSection
} from '@/components/sheet-form'
import type { Contact } from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import {
  CONTACT_NOTES_MAX_LENGTH,
  MAX_EMAILS,
  MAX_PHONES,
  type contactFormSchema
} from '@/modules/contacts/contacts-schema'
import { useContactForm } from '@/modules/contacts/hooks/use-contact-form'
import { RELATIONSHIP_OPTIONS } from '@/modules/contacts/utils/display'

const FORM_ID = 'contact-form'

const GRID = 'grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2'
const FULL_WIDTH = 'sm:col-span-2'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
  onSubmit: (values: ReturnType<typeof contactFormSchema.parse>) => Promise<void>
}

export function ContactSheet({ open, onOpenChange, contact, onSubmit }: Props) {
  const isEdit = contact !== null
  const [isConfirmingDiscard, setConfirmingDiscard] = useState(false)

  const { form, discard } = useContactForm({ open, contact, onSubmit })

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
          icon={isEdit ? 'pencil' : 'user-plus'}
          title={isEdit ? m.contact_editTitle() : m.contact_createTitle()}
          description={isEdit ? m.contact_editDescription() : m.contact_createDescription()}
          onClose={requestClose}
        />

        <SheetFormBody
          id={FORM_ID}
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit().catch(() => {})
          }}
        >
          <SheetFormSection>
            <div className={GRID}>
              <form.AppField name="firstName">
                {(field) => (
                  <field.TextInputField
                    size="form"
                    label={m.contact_firstNameLabel()}
                    placeholder={m.contact_firstNamePlaceholder()}
                  />
                )}
              </form.AppField>

              <form.AppField name="lastName">
                {(field) => (
                  <field.TextInputField
                    size="form"
                    label={m.contact_lastNameLabel()}
                    placeholder={m.contact_lastNamePlaceholder()}
                  />
                )}
              </form.AppField>

              <form.AppField name="company">
                {(field) => (
                  <field.TextInputField
                    size="form"
                    label={m.contact_companyLabel()}
                    placeholder={m.contact_companyPlaceholder()}
                  />
                )}
              </form.AppField>

              <form.AppField name="jobTitle">
                {(field) => (
                  <field.TextInputField
                    size="form"
                    label={m.contact_jobTitleLabel()}
                    placeholder={m.contact_jobTitlePlaceholder()}
                  />
                )}
              </form.AppField>

              <form.AppField name="city">
                {(field) => (
                  <field.TextInputField
                    size="form"
                    label={m.contact_cityLabel()}
                    placeholder={m.contact_cityPlaceholder()}
                  />
                )}
              </form.AppField>

              <form.AppField name="relationship">
                {(field) => (
                  <field.SelectField
                    label={m.contact_relationshipLabel()}
                    options={RELATIONSHIP_OPTIONS()}
                    placeholder={m.contact_relationshipOther()}
                  />
                )}
              </form.AppField>
            </div>
          </SheetFormSection>

          <SheetFormSection title={m.contact_sectionReachability()}>
            <div className={GRID}>
              <form.AppField name="emails">
                {(field) => (
                  <field.StringListField
                    label={m.contact_emailsLabel()}
                    placeholder={m.contact_emailPlaceholder()}
                    type="email"
                    addLabel={m.contact_addEmail()}
                    removeLabel={m.contact_removeEmail()}
                    maxEntries={MAX_EMAILS}
                  />
                )}
              </form.AppField>

              <form.AppField name="phones">
                {(field) => (
                  <field.StringListField
                    label={m.contact_phonesLabel()}
                    placeholder={m.contact_phonePlaceholder()}
                    type="tel"
                    addLabel={m.contact_addPhone()}
                    removeLabel={m.contact_removePhone()}
                    maxEntries={MAX_PHONES}
                    tabular
                  />
                )}
              </form.AppField>

              <form.AppField name="linkedinUrl">
                {(field) => (
                  <field.TextInputField
                    size="form"
                    label={m.contact_linkedinLabel()}
                    placeholder={m.contact_linkedinPlaceholder()}
                    type="url"
                    className={FULL_WIDTH}
                  />
                )}
              </form.AppField>
            </div>
          </SheetFormSection>

          <SheetFormSection title={m.contact_sectionNotes()}>
            <form.AppField name="notes">
              {(field) => (
                <field.TextareaField
                  label={m.contact_notesLabel()}
                  placeholder={m.contact_notesPlaceholder()}
                  maxLength={CONTACT_NOTES_MAX_LENGTH}
                />
              )}
            </form.AppField>
          </SheetFormSection>
        </SheetFormBody>

        <SheetFormFooter
          primaryCta={
            <form.AppForm>
              <form.SubmitButton
                formId={FORM_ID}
                requiresChanges
                label={isEdit ? m.common_save() : m.contact_createSubmit()}
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
        title={m.contact_discardTitle()}
        description={m.contact_discardDescription()}
        confirmLabel={m.contact_discardConfirm()}
        onConfirm={() => {
          setConfirmingDiscard(false)
          discard()
          onOpenChange(false)
        }}
      />
    </Sheet>
  )
}
