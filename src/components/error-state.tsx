import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="font-mono text-6xl font-bold text-neutral-300 dark:text-neutral-700">!</p>
      <h1 className="text-2xl font-semibold tracking-tight">Une erreur est survenue</h1>
      <p className="max-w-sm text-neutral-500 dark:text-neutral-400">
        Impossible de charger la page. Réessayez dans un instant.
      </p>
      <div className="mt-2 flex gap-3">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            Réessayer
          </Button>
        ) : null}
        <Link
          to="/"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Retour à l'accueil
        </Link>
      </div>
    </main>
  )
}
