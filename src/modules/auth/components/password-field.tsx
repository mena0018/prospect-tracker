import type { AnyFieldApi } from '@tanstack/react-form'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { m } from '@/i18n/paraglide/messages'

type Props = {
  field: AnyFieldApi
  label: string
  autoComplete: 'current-password' | 'new-password'
  shown: boolean
  onToggle?: () => void
  withForgotLink?: boolean
}

export function PasswordField({
  field,
  label,
  autoComplete,
  shown,
  onToggle,
  withForgotLink = false
}: Props) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {/* TODO: link to the reset route once it exists. */}
        {withForgotLink ? (
          <span className="text-muted-foreground text-xs font-medium">
            {m.auth_forgotPassword()}
          </span>
        ) : null}
      </div>
      <div className="relative">
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          type={shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className={onToggle ? 'pr-11' : undefined}
        />
        {onToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            tabIndex={-1}
            title={m.auth_togglePassword()}
            aria-label={shown ? m.auth_hidePassword() : m.auth_showPassword()}
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2"
          >
            {shown ? <EyeOff /> : <Eye />}
          </Button>
        ) : null}
      </div>
      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
    </Field>
  )
}
