import { useState } from 'react'

import { useRouter } from '@tanstack/react-router'

import { useAppForm } from '@/components/form/form-hook'
import { toFormErrorCode } from '@/modules/auth/auth-utils'
import { toErrorMessage } from '@/lib/error'
import { OAuthSection } from '@/modules/auth/components/oauth-section'
import { useGoogleOAuth } from '@/modules/auth/use-google-oauth'
import { FieldAlert, FieldGroup } from '@/components/ui/field'
import { m } from '@/i18n/paraglide/messages'
import { signUpFormSchema } from '@/modules/auth/auth-schema'
import { signUpWithPassword } from '@/modules/auth/auth-server'

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

  const form = useAppForm({
    defaultValues: { fullName: '', jobTitle: '', email, password: '', confirmPassword: '' },
    validators: {
      onChange: signUpFormSchema,
      onSubmitAsync: async ({ value }) => {
        const { errorCode } = await signUpWithPassword({
          data: {
            fullName: value.fullName,
            jobTitle: value.jobTitle,
            email: value.email,
            password: value.password
          }
        })
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
        <form.AppField name="fullName">
          {(field) => (
            <field.TextInputField
              label={m.auth_fullNameLabel()}
              placeholder={m.auth_fullNamePlaceholder()}
              autoComplete="name"
            />
          )}
        </form.AppField>

        <form.AppField name="jobTitle">
          {(field) => (
            <field.TextInputField
              label={m.auth_jobTitleLabel()}
              placeholder={m.auth_jobTitlePlaceholder()}
              autoComplete="organization-title"
            />
          )}
        </form.AppField>

        <form.AppField name="email">
          {(field) => (
            <field.TextInputField
              type="email"
              label={m.auth_emailLabel()}
              placeholder={m.auth_emailPlaceholder()}
              autoComplete="email"
              onBlurValue={onEmailChange}
            />
          )}
        </form.AppField>

        <form.AppField name="password">
          {(field) => (
            <field.PasswordField
              label={m.auth_passwordLabel()}
              autoComplete="new-password"
              shown={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
            />
          )}
        </form.AppField>

        <form.AppField name="confirmPassword">
          {(field) => (
            <field.PasswordField
              label={m.auth_confirmPasswordLabel()}
              autoComplete="new-password"
              shown={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
            />
          )}
        </form.AppField>

        <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
          {(formError) => {
            const code = toFormErrorCode(formError)
            const message = code ? toErrorMessage(code) : googleError
            return message ? <FieldAlert>{message}</FieldAlert> : null
          }}
        </form.Subscribe>

        <form.AppForm>
          <form.SubmitButton label={m.auth_signupSubmit()} busy={googleMutation.isPending} />
        </form.AppForm>

        <OAuthSection pending={googleMutation.isPending} onClick={() => googleMutation.mutate()} />
      </FieldGroup>
    </form>
  )
}
