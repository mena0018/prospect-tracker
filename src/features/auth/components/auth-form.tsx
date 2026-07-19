import { useState } from 'react'

import { Link, useSearch } from '@tanstack/react-router'

import { SigninForm } from '@/features/auth/components/signin-form'
import { SignupForm } from '@/features/auth/components/signup-form'
import { APP_ROUTES } from '@/lib/routes'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const { mode, redirect, error } = useSearch({ from: APP_ROUTES.login })

  const isSignin = mode === 'signin'
  const oauthFailed = error === 'oauth'
  const next = redirect ?? APP_ROUTES.dashboard

  const formProps = { email, oauthFailed, next, onEmailChange: setEmail }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {isSignin ? 'Bon retour' : 'Créer votre compte'}
        </h1>
        <p className="text-muted-foreground">
          {isSignin
            ? 'Reprenez le suivi de votre prospection.'
            : 'Commencez à suivre votre prospection.'}
        </p>
      </div>

      {isSignin ? <SigninForm {...formProps} /> : <SignupForm {...formProps} />}

      <p className="text-muted-foreground mt-8 space-x-1 text-center text-sm">
        <span>{isSignin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}</span>
        <Link
          to={APP_ROUTES.login}
          search={(prev) => ({ ...prev, mode: isSignin ? 'signup' : 'signin' })}
          className="text-foreground hover:text-primary underline underline-offset-4"
        >
          {isSignin ? 'Créer un compte' : 'Se connecter'}
        </Link>
      </p>
    </div>
  )
}
