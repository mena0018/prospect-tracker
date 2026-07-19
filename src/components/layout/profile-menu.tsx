import { ChevronUp, LogOut, User as UserIcon, Bell } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { API_ROUTES } from '@/lib/routes'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export type Profile = {
  name: string
  subtitle: string
  initials: string
  avatarUrl: string | null
}

type ProfileAvatarProps = {
  initials: string
  className: string
  avatarUrl: string | null
}

function ProfileAvatar({ avatarUrl, initials, className }: ProfileAvatarProps) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="Avatar" className={cn('object-cover', className)} />
  }
  return (
    <span className={cn('bg-surface-2 text-text-soft font-semibold', className)}>{initials}</span>
  )
}

const ITEM_CLASS =
  'text-text-soft gap-2.5 rounded-lg px-2.25 py-2 text-xs font-medium [&_svg]:size-3.75!'

async function handleLogout() {
  await getSupabaseBrowserClient().auth.signOut()
  window.location.href = API_ROUTES.authLogout
}

export function ProfileMenu({ name, subtitle, initials, avatarUrl }: Profile) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-surface-2 flex w-full items-center gap-2.5 rounded-lg px-2.75 py-2 text-left outline-none">
        <ProfileAvatar
          avatarUrl={avatarUrl}
          initials={initials}
          className="flex size-8 flex-none items-center justify-center rounded-full text-xs"
        />
        <span className="flex min-w-0 flex-1 flex-col leading-[1.2]">
          <span className="text-foreground truncate text-sm font-semibold">{name}</span>
          <span className="text-muted-foreground text-2xs truncate">{subtitle}</span>
        </span>
        <ChevronUp className="text-muted-foreground size-3.5 flex-none" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-(--anchor-width) min-w-56 overflow-hidden rounded-xl p-0 shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
      >
        <div className="border-border-soft flex items-center gap-2.5 border-b px-3.25 py-3">
          <ProfileAvatar
            avatarUrl={avatarUrl}
            initials={initials}
            className="text-2xs flex size-7.5 flex-none items-center justify-center rounded-full"
          />
          <span className="flex min-w-0 flex-col leading-[1.2]">
            <span className="text-foreground truncate text-xs font-semibold">{name}</span>
            <span className="text-muted-foreground text-2xs truncate">{subtitle}</span>
          </span>
        </div>

        <div className="flex flex-col gap-0.75 p-1.5">
          <DropdownMenuItem className={ITEM_CLASS}>
            <UserIcon />
            Compte
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM_CLASS}>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-border-soft mx-0 my-0" />

        <div className="p-1.5">
          <DropdownMenuItem className={ITEM_CLASS} onClick={handleLogout}>
            <LogOut />
            Se déconnecter
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
