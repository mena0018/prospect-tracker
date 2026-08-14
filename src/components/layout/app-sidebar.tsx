import { ArrowRight, Bell, ListFilter } from 'lucide-react'

import { CustomizeIcon } from '@/components/icons/customize'
import { BrandMark } from '@/components/icons/brand-mark'
import { ProfileMenu } from '@/modules/auth/components/profile-menu'
import { AppSidebarFooter } from '@/components/layout/app-sidebar-footer'
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
import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'
import { stageColorVar } from '@/modules/stages/stages-utils'
import { useStageCounts } from '@/modules/stages/hooks/use-stage-counts'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_STAGES } from '@/db/defaults'

// The weekly goal has no data source yet — it lands with the follow-ups section (DEV-30).
const WEEKLY_GOAL = 15
const WEEKLY_DONE = 6
const WEEKLY_PCT = Math.min(100, Math.round((WEEKLY_DONE / WEEKLY_GOAL) * 100))

export function AppSidebar() {
  const { stages, dueCount } = useStageCounts()
  const { setTab, setDueOnly } = useOpportunitiesFilters()

  // Due rows only exist on the active tab.
  const startFollowUps = () => {
    setTab('active')
    setDueOnly(true)
  }

  return (
    <Sidebar>
      <SidebarHeader className="gap-0 p-0 px-4 pt-4.5">
        <div className="flex items-center gap-2.75 px-1.5 pt-1.5 pb-5">
          <div className="bg-primary text-primary-foreground flex size-8.5 flex-none items-center justify-center rounded-lg">
            <BrandMark className="size-7.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground text-md font-heading tracking-title font-semibold">
              {CONFIG.brand}
            </span>
            <span className="text-muted-foreground text-xs">{m.common_tagline()}</span>
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
            {stages.length === 0
              ? Array.from({ length: DEFAULT_STAGES.length }, (_, index) => (
                  <Skeleton key={index} className="my-1.5 h-5 w-53 rounded-sm" />
                ))
              : stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="text-secondary-foreground flex items-center justify-between py-1.25 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2 flex-none rounded-full"
                        style={{ backgroundColor: stageColorVar(stage.color) }}
                      />
                      <span className="truncate">{stage.name}</span>
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
                    <span className="tracking-page-title text-lg font-semibold tabular-nums">
                      {dueCount}
                    </span>
                    <span className="text-muted-foreground text-xs">{m.followUp_toContact()}</span>
                  </div>
                  <div className="text-muted-foreground text-xs">{m.followUp_tagline()}</div>
                </div>
              </div>
              <div className="mt-3.25">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{m.followUp_weeklyGoal()}</span>
                  <span className="font-semibold tabular-nums">
                    {WEEKLY_DONE}/{WEEKLY_GOAL}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-black/6 dark:bg-white/12">
                  <div
                    className="bg-primary animate-grow h-full rounded-full"
                    style={{ width: `${WEEKLY_PCT}%` }}
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={startFollowUps}
                className="mt-3.25 h-9 w-full font-semibold"
              >
                {m.followUp_start()}
                <ArrowRight />
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-0 p-0 px-4 py-4.5">
        <AppSidebarFooter />
        <Separator className="my-1.75 mr-2.75 w-auto!" />
        <ProfileMenu />
      </SidebarFooter>
    </Sidebar>
  )
}
