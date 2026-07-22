import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { APP_ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

type Props = Partial<{
  title: string
  description: string
  showHomeLink: boolean
  variant: 'page' | 'section'
  onRetry: () => void
}>

export function ErrorState({
  title = 'Une erreur est survenue.',
  description = 'Impossible de charger ces données. Réessayez dans un instant.',
  variant = 'page',
  showHomeLink = variant === 'page',
  onRetry
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 p-8 text-center',
        variant === 'page' ? 'min-h-screen' : 'size-full min-h-70'
      )}
    >
      <p
        className={cn(
          'text-muted-foreground/40 font-mono font-bold',
          variant === 'page' ? 'text-6xl' : 'text-4xl'
        )}
      >
        !
      </p>
      <h2
        className={cn('font-semibold tracking-tight', variant === 'page' ? 'text-2xl' : 'text-lg')}
      >
        {title}
      </h2>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      <div className="mt-2 flex gap-3">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            Réessayer
          </Button>
        ) : null}
        {showHomeLink ? (
          <Button type="button" variant="outline" render={<Link to={APP_ROUTES.home} />}>
            Retour à l'accueil
          </Button>
        ) : null}
      </div>
    </div>
  )
}
