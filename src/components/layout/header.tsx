import { Lightbulb, Plus } from 'lucide-react'

import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'

type Props = {
  subtitle: string
}

export function Header({ subtitle }: Props) {
  return (
    <header className="border-border bg-surface flex flex-none items-center justify-between gap-4 border-b px-6.5 py-3.5">
      <div className="flex min-w-0 flex-1 items-center gap-3.25">
        <SidebarTrigger
          variant="outline"
          className="text-text-soft bg-surface hover:bg-surface-2 hover:text-text-soft size-9.5 flex-none rounded-[9px] [&_svg]:size-4.25"
          title="Replier / déplier la barre latérale"
        />
        <div className="flex min-w-0 flex-col leading-[1.2]">
          <h1 className="text-foreground truncate text-[19px] font-semibold tracking-[-0.3px]">
            Tracker
          </h1>
          <span className="text-muted-foreground mt-0.5 truncate text-[12.5px]">{subtitle}</span>
        </div>
      </div>
      <div className="flex flex-none items-center gap-2.25">
        <Button
          variant="outline"
          className="text-text-soft bg-surface hover:bg-surface-2 hover:text-text-soft h-9.5 gap-1.75 rounded-[9px] px-3.25 text-[13px] font-medium [&_svg]:size-4"
        >
          <Lightbulb />
          <span className="max-sm:sr-only">Idée</span>
        </Button>
        <ThemeToggle className="text-text-soft bg-surface hover:bg-surface-2 hover:text-text-soft size-9.5 rounded-[9px] [&_svg]:size-4.5" />
        <Button className="h-9.5 gap-1.75 rounded-[9px] px-3.75 text-[13.5px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)] [&_svg]:size-4">
          <Plus />
          <span className="max-sm:sr-only">Nouvelle opportunité</span>
        </Button>
      </div>
    </header>
  )
}
