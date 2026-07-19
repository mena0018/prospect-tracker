import { useState } from 'react'

import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'

import { EmailField } from '@/features/auth/components/email-field'
import { toErrorMessage } from '@/features/auth/auth-utils'
import { OAuthSection } from '@/features/auth/components/oauth-section'
import { PasswordField } from '@/features/auth/components/password-field'
import { useGoogleOAuth } from '@/features/auth/use-google-oauth'
import { Button } from '@/components/ui/button'
import { Field, FieldAlert, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { signUpFormSchema } from '@/features/auth/auth-schema'
import { signUpWithPassword } from '@/server/auth'

type Props = {
  next: string
  oauthFailed: boolean
  email: string
  onEmailChange: (email: string) => void
}

export function SignupForm({ next, oauthFailed, email, onEmailChange }: Props) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const { googleMutation, googleError } = useGoogleOAuth(next, oauthFailed)

  const form = useForm({
    defaultValues: { fullName: '', email, password: '', confirmPassword: '' },
    validators: {
      onChange: signUpFormSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await signUpWithPassword({
          data: { fullName: value.fullName, email: value.email, password: value.password }
        })
        return error ? { form: error } : null
      }
    },
    onSubmit: () => {
      router.invalidate()
      router.navigate({ to: next })
    }
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field name="fullName">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Nom complet</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="name"
                  placeholder="Alex Laurent"
                />
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            )
          }}
        </form.Field>

        <form.Field name="email">
          {(field) => <EmailField field={field} autoComplete="email" onSync={onEmailChange} />}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <PasswordField
              field={field}
              label="Mot de passe"
              autoComplete="new-password"
              shown={showPassword}
              onToggle={() => setShowPassword((shown) => !shown)}
            />
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <PasswordField
              field={field}
              label="Confirmer le mot de passe"
              autoComplete="new-password"
              shown={showPassword}
            />
          )}
        </form.Field>

        <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
          {(formError) => {
            const message = toErrorMessage(formError) ?? googleError
            return message ? <FieldAlert>{message}</FieldAlert> : null
          }}
        </form.Subscribe>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!canSubmit || googleMutation.isPending}
            >
              Créer mon compte
            </Button>
          )}
        </form.Subscribe>

        <OAuthSection pending={googleMutation.isPending} onClick={() => googleMutation.mutate()} />
      </FieldGroup>
    </form>
  )
}
