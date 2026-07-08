import { useState } from 'react'

import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { z } from 'zod'

import { APP_ROUTES, API_ROUTES } from '@/lib/routes'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { signInWithPassword, signUpWithPassword } from '@/server/auth'

const searchSchema = z.object({
  redirect: z.string().optional(),
  error: z.string().optional()
})

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.user) {
      throw redirect({ to: search.redirect ?? APP_ROUTES.dashboard })
    }
  },
  component: LoginPage
})

function LoginPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(
    search.error === 'oauth' ? 'La connexion Google a échoué. Réessayez.' : null
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const fn = mode === 'signin' ? signInWithPassword : signUpWithPassword
    const { error: authError } = await fn({ data: { email, password } })

    if (authError) {
      setError(authError)
      setPending(false)
      return
    }

    // Refresh so root beforeLoad re-resolves the session set on the response.
    await router.invalidate()
    await router.navigate({ to: search.redirect ?? APP_ROUTES.dashboard })
  }

  async function handleGoogle() {
    setPending(true)
    setError(null)
    const supabase = getSupabaseBrowserClient()
    const redirectTo = `${window.location.origin}${API_ROUTES.authCallback}?next=${encodeURIComponent(
      search.redirect ?? APP_ROUTES.dashboard
    )}`
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })
    if (oauthError) {
      setError('Impossible de démarrer la connexion Google.')
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Suivez votre prospection, sans friction.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
        >
          <GoogleIcon />
          Continuer avec Google
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          <span className="text-xs text-neutral-400">ou</span>
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm transition-colors outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-400"
          />
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm transition-colors outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-400"
          />

          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {pending ? '…' : mode === 'signin' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          {mode === 'signin' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
            }}
            className="font-medium text-neutral-900 underline underline-offset-2 dark:text-white"
          >
            {mode === 'signin' ? 'Créer un compte' : 'Se connecter'}
          </button>
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}
