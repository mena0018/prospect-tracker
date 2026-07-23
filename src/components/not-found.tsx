import { Link } from '@tanstack/react-router'

import { m } from '@/i18n/paraglide/messages'

export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="font-mono text-6xl font-bold text-neutral-300 dark:text-neutral-700">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">{m.notFound_title()}</h1>
      <p className="max-w-sm text-neutral-500 dark:text-neutral-400">{m.notFound_description()}</p>
      <Link
        to="/"
        className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {m.common_backHome()}
      </Link>
    </main>
  )
}
