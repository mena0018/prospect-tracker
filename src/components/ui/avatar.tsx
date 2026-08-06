import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'

type Props = {
  avatarUrl: string | null
  initials: string
  className?: string
}

export function Avatar({ avatarUrl, initials, className }: Props) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={m.profile_avatarAlt()}
        className={cn('flex-none rounded-full object-cover', className)}
      />
    )
  }

  return (
    <span
      className={cn(
        'bg-muted text-muted-foreground flex flex-none items-center justify-center rounded-full font-semibold',
        className
      )}
    >
      {initials}
    </span>
  )
}
