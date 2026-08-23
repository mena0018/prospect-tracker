import { ChevronRight, RotateCcw, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { Stage } from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import { StageBadge } from '@/modules/stages/components/stage-badge'

type Props = {
  stages: Stage[]
  counts: Map<string, number>
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}

export function ArchivedStagesSection({ stages, counts, onRestore, onDelete }: Props) {
  return (
    <Collapsible className="border-border-soft bg-muted/55 border-t">
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2.5 px-4.5 py-3.5 text-left outline-none"
          />
        }
      >
        <ChevronRight className="text-muted-foreground size-3.75 transition-transform duration-200 in-data-panel-open:rotate-90" />
        <span className="text-muted-foreground tracking-label text-2xs font-semibold uppercase">
          {m.customize_archivedSectionTitle()}
        </span>
        <Badge variant="outline" className="text-muted-foreground tabular-nums">
          {stages.length}
        </Badge>
        <span className="flex-1" />
        <span className="text-muted-foreground text-xs">{m.customize_archivedSectionHint()}</span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="flex flex-col gap-2.5 px-4.5 pb-4.5">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="border-border-soft bg-card flex items-center gap-3 rounded-xl border p-3.5 opacity-72"
            >
              <StageBadge
                variant="plain"
                name={stage.name}
                color={stage.color}
                className="text-secondary-foreground flex-1 text-sm font-medium"
              />
              <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                {m.customize_stageCount({ count: counts.get(stage.id) ?? 0 })}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {m.customize_delayShort({ days: stage.reminderDelayDays })}
              </span>
              <Button variant="outline" size="sm" onClick={() => onRestore(stage.id)}>
                <RotateCcw />
                {m.customize_restore()}
              </Button>
              {stage.systemKey === null && (counts.get(stage.id) ?? 0) === 0 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={m.common_delete()}
                  title={m.common_delete()}
                  onClick={() => onDelete(stage.id)}
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
