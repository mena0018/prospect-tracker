import { Bell, Filter, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import { isStatusTab } from '@/modules/opportunities/opportunities-utils'
import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'

const SEARCH_DEBOUNCE_MS = 300

// Container-driven, not viewport-driven: the sidebar makes viewport breakpoints lie.
const TOOLBAR_LAYOUT =
  'border-border-soft @container flex flex-none flex-wrap items-center justify-between gap-4 border-b px-4.5 py-3.75'
const TABS_LAYOUT = 'flex grow basis-100 flex-wrap items-center gap-3 @2xl:basis-auto'
const SEARCH_LAYOUT = 'flex grow basis-100 items-center justify-end gap-2.5 @2xl:basis-auto'

// Fixed so the skeleton matches exactly; `grow-0` stops `grow` overriding the width.
const TOGGLE_WIDTH = '@2xl:w-70 @2xl:grow-0'

type Props = {
  activeCount: number
  archivedCount: number
  onClearDueFilter: () => void
}

function TabCount({ value, isSelected }: { value: number; isSelected: boolean }) {
  return (
    <span
      className={cn(
        'text-muted-foreground rounded-full px-1.5 text-xs font-semibold tabular-nums',
        isSelected && 'bg-secondary'
      )}
    >
      {value}
    </span>
  )
}

export function OpportunitiesToolbar({ activeCount, archivedCount, onClearDueFilter }: Props) {
  const { tab: statusTab, search, isDueOnly, setTab, setSearch } = useOpportunitiesFilters()

  // Typing stays local and lands in the URL on a pause, so it doesn't navigate per keystroke.
  const [draft, setDraft] = useState(search)

  useEffect(() => {
    // Skips the mount pass, which would reset `page` and drop what the URL was opened with.
    if (draft === search) return

    const timer = setTimeout(() => setSearch(draft), SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [draft, search, setSearch])

  return (
    <div className={TOOLBAR_LAYOUT}>
      <div className={TABS_LAYOUT}>
        <ToggleGroup
          value={[statusTab]}
          onValueChange={([next]) => {
            if (isStatusTab(next)) setTab(next)
          }}
          spacing={1}
          className={cn(
            'bg-secondary h-8.75 grow gap-0 rounded-[9px] border-none p-0.75',
            TOGGLE_WIDTH
          )}
        >
          <ToggleGroupItem
            value="active"
            variant="selected"
            className="h-full flex-1 gap-1.5 rounded-[7px] px-3.25 text-sm font-semibold data-pressed:shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          >
            {m.table_tabActive({ count: activeCount })}
            <TabCount value={activeCount} isSelected={statusTab === 'active'} />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="archived"
            variant="selected"
            className="h-full flex-1 gap-1.5 rounded-[7px] px-3.25 text-sm font-semibold data-pressed:shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          >
            {m.table_tabArchived({ count: archivedCount })}
            <TabCount value={archivedCount} isSelected={statusTab === 'archived'} />
          </ToggleGroupItem>
        </ToggleGroup>

        {isDueOnly && (
          <div className="bg-accent text-accent-foreground flex items-center gap-1.5 rounded-lg py-1 pr-1 pl-2.5 text-xs font-semibold">
            <Bell className="size-3.5" />
            {m.table_dueFilter()}
            <Button
              variant="ghost"
              size="icon-xs"
              title={m.table_clearDueFilter()}
              onClick={onClearDueFilter}
              className="text-accent-foreground hover:bg-primary/15"
            >
              <X />
            </Button>
          </div>
        )}
      </div>

      <div className={SEARCH_LAYOUT}>
        <div className="relative grow @2xl:max-w-57.5">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.75 size-3.75 -translate-y-1/2" />
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={m.table_searchPlaceholder()}
            className="bg-secondary h-9 pl-8.5 text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-secondary-foreground h-9 flex-none gap-1.75 text-sm font-medium"
        >
          <Filter />
          {m.table_filter()}
        </Button>
      </div>
    </div>
  )
}

export function OpportunitiesToolbarSkeleton() {
  return (
    <div className={TOOLBAR_LAYOUT}>
      <div className={TABS_LAYOUT}>
        <Skeleton className={cn('h-8.75 grow rounded-[9px]', TOGGLE_WIDTH)} />
      </div>
      <div className={SEARCH_LAYOUT}>
        <Skeleton className="h-9 grow @2xl:max-w-57.5" />
        <Skeleton className="h-9 w-21 flex-none" />
      </div>
    </div>
  )
}
