import { ArrowRight, Bell, HelpCircle, ListFilter, MessageCircle, Send } from 'lucide-react'

import { CustomizeIcon } from '@/components/icons/customize'
import { LinkedInIcon } from '@/components/icons/linkedin'
import { ProfileMenu, type Profile } from '@/components/layout/profile-menu'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { m } from '@/i18n/paraglide/messages'
import { CONFIG } from '@/lib/config'
import { EXTERNAL_LINKS } from '@/lib/routes'

// Placeholder figures — replaced by real pipeline/relance data in DEV-21.
const PIPELINE_STAGES = [
  { label: 'Sauvegardé', count: 1, color: '#71717a' },
  { label: 'Contacté', count: 2, color: '#3b82f6' },
  { label: 'CV Envoyé', count: 4, color: '#b45309' },
  { label: 'Entretien', count: 3, color: '#0f766e' },
  { label: 'Offre', count: 1, color: '#15803d' },
  { label: 'Refusé', count: 2, color: '#dc2626' },
  { label: 'Ghosté', count: 2, color: '#a1a1aa' }
]

const RELANCE = { count: 6, done: 6, goal: 15 }
const WEEKLY_PCT = Math.min(100, Math.round((RELANCE.done / RELANCE.goal) * 100))

type Props = {
  profile: Profile
}

export function AppSidebar({ profile }: Props) {
  return (
    <Sidebar>
      <SidebarHeader className="gap-0 p-0 px-4 pt-4.5">
        <div className="flex items-center gap-2.75 px-1.5 pt-1.5 pb-5">
          <div className="bg-primary text-primary-foreground tracking-title flex size-8.5 flex-none items-center justify-center rounded-lg text-sm font-semibold">
            {CONFIG.brandInitials}
          </div>
          <div className="flex flex-col leading-[1.15]">
            <span className="text-foreground tracking-title font-semibold">{CONFIG.brand}</span>
            <span className="text-muted-foreground text-2xs">{m.common_tagline()}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-4">
        <SidebarGroup className="shrink-0 p-0">
          <SidebarMenu className="gap-0.75">
            <SidebarMenuItem>
              <SidebarMenuButton isActive render={<a href="#" />}>
                <ListFilter />
                {m.nav_tracker()}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<a href="#" />}>
                <CustomizeIcon />
                {m.nav_customize()}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-5.5 min-h-0 shrink-0 px-2.75 py-0">
          <SidebarGroupLabel>{m.nav_pipeline()}</SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0">
            {PIPELINE_STAGES.map((stage) => (
              <div
                key={stage.label}
                className="text-muted-foreground flex items-center justify-between py-1.25 text-xs"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 flex-none rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  {stage.label}
                </span>
                <span className="text-muted-foreground font-medium tabular-nums">
                  {stage.count}
                </span>
              </div>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6.5 shrink-0 px-2.75 py-0">
          <SidebarGroupLabel>{m.nav_followUps()}</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="border-primary/15 bg-sidebar-accent rounded-xl border px-3.25 pt-3.25 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary text-primary-foreground flex size-8 flex-none items-center justify-center rounded-lg">
                  <Bell className="size-4" />
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-foreground text-lg font-bold tracking-tight tabular-nums">
                      {RELANCE.count}
                    </span>
                    <span className="text-muted-foreground text-xs">{m.followUp_toContact()}</span>
                  </div>
                  <div className="text-muted-foreground text-2xs">{m.followUp_tagline()}</div>
                </div>
              </div>
              <div className="mt-3.25">
                <div className="text-muted-foreground text-2xs mb-1.5 flex items-center justify-between">
                  <span>{m.followUp_weeklyGoal()}</span>
                  <span className="text-foreground font-semibold tabular-nums">
                    {RELANCE.done}/{RELANCE.goal}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-black/6 dark:bg-white/12">
                  <div
                    className="bg-primary animate-grow h-full rounded-full"
                    style={{ width: `${WEEKLY_PCT}%` }}
                  />
                </div>
              </div>
              <Button type="button" size="sm" className="mt-3.25 h-9 w-full font-semibold">
                {m.followUp_start()}
                <ArrowRight />
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-0 p-0 px-4 pb-4.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-muted-foreground h-auto gap-2.5 px-2.75 py-2 text-xs font-medium"
              render={<a href={EXTERNAL_LINKS.invite} />}
            >
              <Send className="size-3.75" />
              {m.nav_inviteFriend()}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Separator className="my-1.75 mr-2.75 w-auto!" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-muted-foreground h-auto gap-2.5 px-2.75 py-1.75 text-xs font-normal"
              render={<a href={EXTERNAL_LINKS.help} />}
            >
              <HelpCircle className="size-3.75" />
              {m.nav_help()}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-muted-foreground h-auto gap-2.5 px-2.75 py-1.75 text-xs font-normal"
              render={<a href={EXTERNAL_LINKS.linkedin} target="_blank" rel="noreferrer" />}
            >
              <LinkedInIcon className="size-3.75" />
              {m.nav_myLinkedin()}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-muted-foreground h-auto gap-2.5 px-2.75 py-1.75 text-xs font-normal"
              render={<a href={EXTERNAL_LINKS.feedback} />}
            >
              <MessageCircle className="size-3.75" />
              {m.nav_giveFeedback()}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Separator className="my-1.75 mr-2.75 w-auto!" />
        <ProfileMenu {...profile} />
      </SidebarFooter>
    </Sidebar>
  )
}
