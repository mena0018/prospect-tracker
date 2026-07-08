import { createFileRoute } from '@tanstack/react-router'

import { API_ROUTES } from '@/lib/routes'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export const Route = createFileRoute('/_authed/app')({
  component: Dashboard
})

function Dashboard() {
  const { user } = Route.useRouteContext()

  async function handleLogout() {
    await getSupabaseBrowserClient().auth.signOut()
    window.location.href = API_ROUTES.authLogout
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
      <p className="text-neutral-500 dark:text-neutral-400">Connecté en tant que {user?.email}</p>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        Se déconnecter
      </button>
    </main>
  )
}
