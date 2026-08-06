import { HelpCircle, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import type { ComponentType } from 'react'

import { LinkedInIcon } from '@/components/icons/linkedin'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar'
import { m } from '@/i18n/paraglide/messages'
import { EXTERNAL_LINKS } from '@/lib/routes'

const ICON_CLASS = 'size-3.75'
const ITEM_CLASS = 'text-secondary-foreground gap-2.5 rounded-lg px-2.25 py-2 text-xs font-medium'

type Link = {
  id: string
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  external?: boolean
}

const inviteLink: Link = {
  id: 'invite',
  href: EXTERNAL_LINKS.invite,
  label: m.nav_inviteFriend(),
  icon: Send
}

const secondaryLinks: Link[] = [
  { id: 'help', href: EXTERNAL_LINKS.help, label: m.nav_help(), icon: HelpCircle },
  {
    id: 'linkedin',
    href: EXTERNAL_LINKS.linkedin,
    label: m.nav_myLinkedin(),
    icon: LinkedInIcon,
    external: true
  },
  {
    id: 'feedback',
    href: EXTERNAL_LINKS.feedback,
    label: m.nav_giveFeedback(),
    icon: MessageCircle
  }
]

function externalProps(link: Link) {
  return link.external ? { target: '_blank', rel: 'noreferrer' } : {}
}

export function AppSidebarFooter() {
  const { isMobile } = useSidebar()

  if (isMobile) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="text-secondary-foreground h-auto gap-2.5 px-2.75 py-2 text-xs font-medium"
            render={<a href={inviteLink.href} />}
          >
            <inviteLink.icon className={ICON_CLASS} />
            {inviteLink.label}
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton className="text-muted-foreground h-auto gap-2.5 px-2.75 py-2 text-xs font-medium" />
              }
            >
              <MoreHorizontal className={ICON_CLASS} />
              {m.nav_more()}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-(--anchor-width) min-w-48 rounded-xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
            >
              {secondaryLinks.map((link) => (
                <DropdownMenuItem
                  key={link.id}
                  className={ITEM_CLASS}
                  render={<a href={link.href} {...externalProps(link)} />}
                >
                  <link.icon className={ICON_CLASS} />
                  {link.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="text-secondary-foreground h-auto gap-2.5 px-2.75 py-2 text-xs font-medium"
            render={<a href={inviteLink.href} />}
          >
            <inviteLink.icon className={ICON_CLASS} />
            {inviteLink.label}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <Separator className="my-1.75 mr-2.75 w-auto!" />
      <SidebarMenu>
        {secondaryLinks.map((link) => (
          <SidebarMenuItem key={link.id}>
            <SidebarMenuButton
              className="text-muted-foreground h-auto gap-2.5 px-2.75 py-1.75 text-xs font-normal"
              render={<a href={link.href} {...externalProps(link)} />}
            >
              <link.icon className={ICON_CLASS} />
              {link.label}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
  )
}
