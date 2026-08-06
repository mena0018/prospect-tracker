import { useRouteContext } from '@tanstack/react-router'
import { ChevronUp, LogOut, User as UserIcon, Bell } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/ui/avatar'
import { m } from '@/i18n/paraglide/messages'
import { toDisplayName, toInitials, toProfileSubtitle } from '@/modules/auth/auth-utils'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { API_ROUTES } from '@/lib/routes'

async function signOut() {
  await getSupabaseBrowserClient().auth.signOut()
  window.location.href = API_ROUTES.authLogout
}

const ITEM_ICON_CLASS = 'size-3.75'
const ITEM_CLASS = 'text-secondary-foreground gap-2.5 rounded-lg px-2.25 py-2 text-xs font-medium'

export function ProfileMenu() {
  const { user } = useRouteContext({ from: '/_authed' })
  const { email, avatarUrl } = user

  const name = toDisplayName(user.fullName)
  const initials = toInitials(user.fullName)
  const subtitle = toProfileSubtitle(user.jobTitle, email)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-muted flex w-full items-center gap-2.5 rounded-lg px-2.75 py-2 text-left">
        <Avatar avatarUrl={avatarUrl} initials={initials} className="size-8 text-xs" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{name}</span>
          <span className="text-muted-foreground truncate text-xs">{subtitle}</span>
        </span>
        <ChevronUp className="text-muted-foreground size-3.5 flex-none" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-(--anchor-width) min-w-56 overflow-hidden rounded-xl p-0 shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
      >
        <div className="border-border-soft flex items-center gap-2.5 border-b px-3.25 py-3">
          <Avatar avatarUrl={avatarUrl} initials={initials} className="size-7.5 text-xs" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-semibold">{name}</span>
            <span className="text-muted-foreground truncate text-xs">{email}</span>
          </span>
        </div>

        <div className="flex flex-col gap-0.75 p-1.5">
          <DropdownMenuItem className={ITEM_CLASS}>
            <UserIcon className={ITEM_ICON_CLASS} />
            {m.profile_account()}
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM_CLASS}>
            <Bell className={ITEM_ICON_CLASS} />
            {m.profile_notifications()}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-border-soft mx-0 my-0" />

        <div className="p-1.5">
          <DropdownMenuItem className={ITEM_CLASS} onClick={signOut}>
            <LogOut className={ITEM_ICON_CLASS} />
            {m.profile_signOut()}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
