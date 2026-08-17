import { Button } from '@/components/ui/button'
import { useFormContext } from '@/components/form/form-context'

type Props = {
  label: string
  busy?: boolean
  formId?: string
  // Opt-in: with nothing changed there is nothing to save, so the request is skipped. Forms
  // whose defaults are already a valid submission (sign-in) leave it off. `isDefaultValue`
  // compares against the current defaults rather than latching like `isDirty`, so typing a
  // character and deleting it disables the button again.
  requiresChanges?: boolean
  className?: string
}

export function SubmitButton({ label, busy, formId, requiresChanges, className }: Props) {
  const form = useFormContext()

  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting, state.isDefaultValue] as const}
    >
      {([canSubmit, isSubmitting, isDefaultValue]) => (
        <Button
          type="submit"
          form={formId}
          loading={isSubmitting}
          disabled={!canSubmit || busy || (requiresChanges && isDefaultValue)}
          className={className}
        >
          {label}
        </Button>
      )}
    </form.Subscribe>
  )
}
