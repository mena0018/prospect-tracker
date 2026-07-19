import { type PropsWithChildren } from 'react'

import { Header } from '@/components/layout/header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { type Profile } from '@/components/layout/profile-menu'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

type Props = PropsWithChildren<{
  headerSubtitle: string
  defaultSidebarOpen: boolean
  profile: Profile
}>

export function AppShell({ headerSubtitle, defaultSidebarOpen, profile, children }: Props) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AppSidebar profile={profile} />
      <SidebarInset className="flex h-svh min-w-0 flex-col overflow-hidden">
        <Header subtitle={headerSubtitle} />
        <div className="bg-background flex-1 overflow-y-auto px-6.5 pt-5.5 pb-8.5">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
