import { FormField } from '@/components/form/form-field'
import { useFieldContext } from '@/components/form/form-context'

type ControlProps = {
  id: string
  name: string
  required: boolean
  value: string
  onValueChange: (value: unknown) => void
  onBlur: () => void
  'aria-invalid': boolean
}

type Props = {
  label: string
  required?: boolean
  className?: string
  children: (props: ControlProps) => React.ReactNode
}

export function RadioGroupField({ label, required, className, children }: Props) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <FormField label={label} required={required} className={className}>
      {children({
        id: field.name,
        name: field.name,
        value: field.state.value,
        'aria-invalid': isInvalid,
        required: Boolean(required),
        onBlur: field.handleBlur,
        onValueChange: (next) => field.handleChange(String(next))
      })}
    </FormField>
  )
}
