import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

import { AuthForm } from '@/modules/auth/components/auth-form'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { APP_ROUTES } from '@/lib/routes'

const searchSchema = z.object({
  redirect: z.string().optional(),
  error: z.string().optional(),
  mode: z.enum(['signin', 'signup']).default('signin')
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
  return (
    <main className="bg-surface grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="bg-surface-2 border-border relative hidden flex-col justify-between overflow-hidden border-r p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_420px_at_22%_16%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_66%),radial-gradient(340px_280px_at_14%_10%,color-mix(in_oklch,var(--primary)_11%,transparent),transparent_70%)]"
        />

        <div className="relative flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg text-sm font-semibold tracking-tight">
            PT
          </div>
          <span className="text-foreground text-lg font-bold tracking-tight">ProspectTracker</span>
        </div>

        <figure className="relative max-w-sm space-y-5">
          <blockquote className="text-foreground font-heading text-xl leading-relaxed font-medium text-balance">
            « Avant, mes relances vivaient dans un coin de tête. Maintenant je sais quoi faire, et
            quand. »
          </blockquote>
          <figcaption className="text-text-soft text-sm">Sofia · développeuse freelance</figcaption>
        </figure>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg text-xs font-semibold tracking-tight">
              PT
            </div>
            <span className="text-foreground text-sm font-semibold tracking-tight">
              ProspectTracker
            </span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16 md:px-10">
          <AuthForm />
        </div>
      </div>
    </main>
  )
}
