import { FilterX, Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DebouncedInput } from '@/components/debounced-input'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { m } from '@/i18n/paraglide/messages'
import { CONTACT_RELATIONSHIPS } from '@/db/schema'
import { useContactsFilters } from '@/modules/contacts/hooks/use-contacts-filters'
import { relationshipLabel, toRelationshipFilter } from '@/modules/contacts/utils/display'

// Container-driven, not viewport-driven: the sidebar makes viewport breakpoints lie.
const TOOLBAR_LAYOUT =
  'border-border-soft @container flex flex-none flex-wrap items-center justify-between gap-4 border-b px-4.5 py-3.75'
const TITLE_LAYOUT = 'flex grow basis-60 items-center gap-3'
// Wraps like the tracker's own toolbar: four controls on one row overflow a phone-width
// container, and the last one (Nouveau contact) gets clipped.
const SEARCH_LAYOUT =
  'flex grow basis-100 flex-wrap items-center gap-2.5 justify-start @4xl:flex-nowrap @4xl:justify-end @4xl:basis-auto'

type Props = {
  total: number
  onCreate: () => void
}

export function ContactsToolbar({ total, onCreate }: Props) {
  const { search, relationship, hasFilters, setSearch, setRelationship, resetFilters } =
    useContactsFilters()

  return (
    <div className={TOOLBAR_LAYOUT}>
      <div className={TITLE_LAYOUT}>
        <h2 className="font-heading text-md font-semibold">{m.contact_pageTitle()}</h2>
        <span className="text-muted-foreground bg-secondary rounded-full px-1.75 text-xs font-semibold tabular-nums">
          {total}
        </span>
      </div>

      <div className={SEARCH_LAYOUT}>
        <InputGroup className="bg-secondary h-9 grow basis-50 @4xl:max-w-64">
          <InputGroupAddon>
            <Search className="size-3.75" />
          </InputGroupAddon>
          <DebouncedInput
            value={search}
            onChange={setSearch}
            placeholder={m.contact_searchPlaceholder()}
          />
        </InputGroup>

        <Select
          value={relationship}
          onValueChange={(next: string | null) => setRelationship(toRelationshipFilter(next))}
        >
          <SelectTrigger size="sm" className="h-9 flex-none gap-1.75">
            <SelectValue placeholder={m.contact_allRelationships()}>
              {(selected: string | null) => {
                const value = toRelationshipFilter(selected)

                return value ? relationshipLabel(value) : m.contact_allRelationships()
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" className="text-muted-foreground">
              {m.contact_allRelationships()}
            </SelectItem>
            {CONTACT_RELATIONSHIPS.map((value) => (
              <SelectItem key={value} value={value}>
                {relationshipLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          disabled={!hasFilters}
          onClick={resetFilters}
          className="text-secondary-foreground h-9 flex-none gap-1.75 text-sm font-medium"
        >
          <FilterX />
          {m.table_resetFilters()}
        </Button>

        <Button size="sm" onClick={onCreate} className="h-9 flex-none gap-1.75 text-sm font-medium">
          <Plus />
          {m.contact_addContact()}
        </Button>
      </div>
    </div>
  )
}

export function ContactsToolbarSkeleton() {
  return (
    <div className={TOOLBAR_LAYOUT}>
      <div className={TITLE_LAYOUT}>
        <Skeleton className="h-6 w-28" />
      </div>
      <div className={SEARCH_LAYOUT}>
        <Skeleton className="h-9 grow @4xl:max-w-64" />
        <Skeleton className="h-9 w-36 flex-none" />
        <Skeleton className="h-9 w-21 flex-none" />
        <Skeleton className="h-9 w-33 flex-none" />
      </div>
    </div>
  )
}
