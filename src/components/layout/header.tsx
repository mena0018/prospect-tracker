import { Plus } from 'lucide-react'

import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { m } from '@/i18n/paraglide/messages'

type Props = {
  subtitle: string
}

export function Header({ subtitle }: Props) {
  return (
    <header className="border-border bg-card flex flex-none items-center justify-between gap-4 border-b px-6.5 py-3.5">
      <div className="flex min-w-0 flex-1 items-center gap-3.25">
        <SidebarTrigger
          variant="outline"
          size="icon-md"
          className="flex-none"
          title={m.header_toggleSidebar()}
        />
        <div className="flex min-w-0 flex-col justify-center gap-1.5">
          <h1 className="text-foreground tracking-title truncate leading-none font-semibold">
            {m.nav_tracker()}
          </h1>
          <span className="text-muted-foreground truncate text-xs leading-none">{subtitle}</span>
        </div>
      </div>
      <div className="flex flex-none items-center gap-2.25">
        <ThemeToggle />
        <Button size="md" className="font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
          <Plus />
          <span className="max-sm:sr-only">{m.header_newOpportunity()}</span>
        </Button>
      </div>
    </header>
  )
}
