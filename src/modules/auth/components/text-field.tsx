import type { AnyFieldApi } from '@tanstack/react-form'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type Props = {
  field: AnyFieldApi
  label: string
  placeholder: string
  autoComplete: 'name' | 'organization-title'
}

export function TextField({ field, label, placeholder, autoComplete }: Props) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
    </Field>
  )
}
