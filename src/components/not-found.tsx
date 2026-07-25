import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { m } from '@/i18n/paraglide/messages'
import { APP_ROUTES } from '@/lib/routes'

export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-muted-foreground/40 font-mono text-6xl font-bold">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">{m.notFound_title()}</h1>
      <p className="text-muted-foreground max-w-sm text-sm">{m.notFound_description()}</p>
      <Button
        type="button"
        variant="outline"
        className="mt-2"
        render={<Link to={APP_ROUTES.home} />}
      >
        {m.common_backHome()}
      </Button>
    </main>
  )
}
