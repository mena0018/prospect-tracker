import { Button } from '@/components/ui/button'
import { useFormContext } from '@/components/form/form-context'

type Props = {
  label: string
  busy?: boolean
  formId?: string
  // Opt-in — off for forms whose defaults already submit. See docs/reference/opportunity-form.md
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
