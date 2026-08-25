import { useRouter } from '@tanstack/react-router'

import { useAppForm } from '@/components/form/form-hook'
import { toFormErrorCode } from '@/modules/auth/utils/error-code'
import { toErrorMessage } from '@/lib/error'
import { OAuthSection } from '@/modules/auth/components/oauth-section'
import { useGoogleOAuth } from '@/modules/auth/hooks/use-google-oauth'
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
  const { googleError, googleMutation } = useGoogleOAuth(next, oauthFailed)

  const form = useAppForm({
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
        <form.AppField name="email">
          {(field) => (
            <field.TextInputField
              type="email"
              label={m.auth_emailLabel()}
              placeholder={m.auth_emailPlaceholder()}
              autoComplete="username"
              onBlurValue={onEmailChange}
            />
          )}
        </form.AppField>

        <form.AppField name="password">
          {(field) => (
            <field.PasswordField
              label={m.auth_passwordLabel()}
              autoComplete="current-password"
              /* TODO: link to the reset route once it exists. */
              labelSuffix={
                <span className="text-muted-foreground text-xs font-medium">
                  {m.auth_forgotPassword()}
                </span>
              }
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
          <form.SubmitButton label={m.auth_signinSubmit()} busy={googleMutation.isPending} />
        </form.AppForm>

        <OAuthSection pending={googleMutation.isPending} onClick={() => googleMutation.mutate()} />
      </FieldGroup>
    </form>
  )
}
