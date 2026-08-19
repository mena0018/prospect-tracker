import { ListFilter } from 'lucide-react'

import { CustomizeIcon } from '@/components/icons/customize'
import { BrandMark } from '@/components/icons/brand-mark'
import { ProfileMenu } from '@/modules/auth/components/profile-menu'
import { AppSidebarFooter } from '@/components/layout/app-sidebar-footer'
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
import { StageBadge } from '@/modules/stages/components/stage-badge'
import { useStageCounts } from '@/modules/stages/hooks/use-stage-counts'
import { Skeleton } from '@/components/ui/skeleton'
import { FollowUpCard } from '@/components/layout/follow-up-card'

export function AppSidebar() {
  const { stages, dueCount, doneToday, hasPipeline, isPending, skeletonCount } = useStageCounts()
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
            {isPending
              ? Array.from({ length: skeletonCount }, (_, index) => (
                  <Skeleton key={index} className="my-1.5 h-5 w-53 rounded-sm" />
                ))
              : stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="text-secondary-foreground flex items-center justify-between py-1.25 text-xs"
                  >
                    <StageBadge variant="plain" name={stage.name} color={stage.color} />
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
            <FollowUpCard
              dueCount={dueCount}
              doneToday={doneToday}
              hasPipeline={hasPipeline}
              onStart={startFollowUps}
            />
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
