import { type PropsWithChildren } from 'react'

import { Header } from '@/components/layout/header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { OpportunityEditorProvider } from '@/modules/opportunities/components/opportunity-editor-provider'

type Props = PropsWithChildren<{
  defaultSidebarOpen: boolean
}>

export function AppShell({ defaultSidebarOpen, children }: Props) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <OpportunityEditorProvider>
        <AppSidebar />
        <SidebarInset className="flex h-svh min-w-0 flex-col overflow-hidden">
          <Header />
          <div className="bg-background flex min-h-0 flex-1 flex-col px-6.5 py-5.5">{children}</div>
        </SidebarInset>
      </OpportunityEditorProvider>
    </SidebarProvider>
  )
}
