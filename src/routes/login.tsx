import { useState } from 'react'

import { useMutation } from '@tanstack/react-query'
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

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const fn = mode === 'signin' ? signInWithPassword : signUpWithPassword
      const { error } = await fn({ data: { email, password } })
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      router.invalidate()
      router.navigate({ to: search.redirect ?? APP_ROUTES.dashboard })
    }
  })

  const googleMutation = useMutation({
    mutationFn: async () => {
      const redirectTo = `${window.location.origin}${API_ROUTES.authCallback}?next=${encodeURIComponent(
        search.redirect ?? APP_ROUTES.dashboard
      )}`
      const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      })
      if (error) throw new Error('Impossible de démarrer la connexion Google.')
    }
  })

  const pending = passwordMutation.isPending || googleMutation.isPending
  const error =
    passwordMutation.error?.message ??
    googleMutation.error?.message ??
    (search.error === 'oauth' ? 'La connexion Google a échoué. Réessayez.' : null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    passwordMutation.mutate()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-sm text-neutral-500">Suivez votre prospection, sans friction.</p>
        </div>

        <button
          type="button"
          onClick={() => googleMutation.mutate()}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          Continuer avec Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs text-neutral-400">ou</span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:outline-none"
          />

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? '…' : mode === 'signin' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {mode === 'signin' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              passwordMutation.reset()
              googleMutation.reset()
            }}
            className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
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
