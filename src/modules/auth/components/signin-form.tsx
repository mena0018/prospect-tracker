import { useState } from 'react'

import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'

import { EmailField } from '@/modules/auth/components/email-field'
import { toFormErrorCode } from '@/modules/auth/auth-utils'
import { toErrorMessage } from '@/lib/error'
import { OAuthSection } from '@/modules/auth/components/oauth-section'
import { PasswordField } from '@/modules/auth/components/password-field'
import { useGoogleOAuth } from '@/modules/auth/use-google-oauth'
import { Button } from '@/components/ui/button'
import { FieldAlert, FieldGroup } from '@/components/ui/field'
import { m } from '@/i18n/paraglide/messages'
import { credentialsSchema } from '@/modules/auth/auth-schema'
import { signInWithPassword } from '@/modules/auth/auth-server'

type Props = {
  next: string
  oauthFailed: boolean
  email: string
  onEmailChange: (email: string) => void
}

export function SigninForm({ next, oauthFailed, email, onEmailChange }: Props) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const { googleError, googleMutation } = useGoogleOAuth(next, oauthFailed)

  const form = useForm({
    defaultValues: { email, password: '' },
    validators: {
      onChange: credentialsSchema,
      onSubmitAsync: async ({ value }) => {
        const { errorCode } = await signInWithPassword({ data: value })
        return errorCode ? { form: errorCode } : null
      }
    },
    onSubmit: async () => {
      await router.invalidate()
      await router.navigate({ to: next })
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
        <form.Field name="email">
          {(field) => <EmailField field={field} autoComplete="username" onSync={onEmailChange} />}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <PasswordField
              withForgotLink
              field={field}
              shown={showPassword}
              label={m.auth_passwordLabel()}
              autoComplete="current-password"
              onToggle={() => setShowPassword((shown) => !shown)}
            />
          )}
        </form.Field>

        <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
          {(formError) => {
            const code = toFormErrorCode(formError)
            const message = code ? toErrorMessage(code) : googleError
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
              {m.auth_signinSubmit()}
            </Button>
          )}
        </form.Subscribe>

        <OAuthSection pending={googleMutation.isPending} onClick={() => googleMutation.mutate()} />
      </FieldGroup>
    </form>
  )
}
