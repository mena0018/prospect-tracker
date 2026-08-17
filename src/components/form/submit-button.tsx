import { Button } from '@/components/ui/button'
import { useFormContext } from '@/components/form/form-context'

type Props = {
  label: string
  busy?: boolean
  formId?: string
  className?: string
}

export function SubmitButton({ label, busy, formId, className }: Props) {
  const form = useFormContext()

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
      {([canSubmit, isSubmitting]) => (
        <Button
          type="submit"
          form={formId}
          loading={isSubmitting}
          disabled={!canSubmit || busy}
          className={className}
        >
          {label}
        </Button>
      )}
    </form.Subscribe>
  )
}
