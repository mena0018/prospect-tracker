import type { AnyFieldApi } from '@tanstack/react-form'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type Props = {
  field: AnyFieldApi
  autoComplete: 'username' | 'email'
  onSync?: (email: string) => void
}

export function EmailField({ field, autoComplete, onSync }: Props) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>Adresse email</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={(e) => {
          field.handleBlur()
          onSync?.(e.target.value)
        }}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        type="email"
        autoComplete={autoComplete}
        placeholder="nom@exemple.com"
      />
      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
    </Field>
  )
}
