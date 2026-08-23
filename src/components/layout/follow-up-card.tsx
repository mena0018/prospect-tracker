import { ArrowRight, Bell, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { FollowUpBurst } from '@/components/layout/follow-up-burst'
import { NumberTicker } from '@/components/number-ticker'
import { ProgressRing } from '@/components/progress-ring'
import { Skeleton } from '@/components/ui/skeleton'
import { m } from '@/i18n/paraglide/messages'
import { useOpportunityEditorContext } from '@/modules/opportunities/components/opportunity-editor-provider'
import { followUpProgress, justClearedQueue } from '@/modules/stages/stages-utils'

const CELEBRATION_MS = 3600

type Props = {
  dueCount: number | undefined
  doneToday: number | undefined
  hasPipeline: boolean
  onStart: () => void
}

// One height across every state, so the skeleton cannot pick the wrong shape.
// See docs/reference/kpis.md
function CardShell({
  children,
  isCelebrating
}: {
  children: React.ReactNode
  isCelebrating?: boolean
}) {
  return (
    <div
      className="border-border bg-card relative flex flex-col gap-3 rounded-[14px] border p-3.25 shadow-xs dark:shadow-none"
      style={
        isCelebrating
          ? { animation: 'follow-up-breath 0.62s cubic-bezier(0.3, 0.9, 0.3, 1) both' }
          : undefined
      }
    >
      {children}
    </div>
  )
}

function Heading({
  ring,
  title,
  caption,
  isCelebrating,
  fadeKey
}: {
  ring: React.ReactNode
  title: React.ReactNode
  caption: React.ReactNode
  isCelebrating?: boolean
  /** Remounts the text block so the crossfade replays when the wording changes. */
  fadeKey?: string
}) {
  return (
    <div className="flex h-11.5 items-center gap-3">
      {ring}
      <div
        key={fadeKey}
        className="min-w-0 leading-tight motion-safe:animate-[follow-up-fade_0.3s_ease_both]"
        style={
          isCelebrating
            ? { animation: 'follow-up-rise 0.34s cubic-bezier(0.2, 0.8, 0.2, 1) 0.06s both' }
            : undefined
        }
      >
        {title}
        <div className="text-muted-foreground mt-0.75 text-xs">{caption}</div>
      </div>
    </div>
  )
}

export function FollowUpCard({ dueCount, doneToday, hasPipeline, onStart }: Props) {
  const { openCreate } = useOpportunityEditorContext()
  const progress = followUpProgress(dueCount, doneToday)
  const [isCelebrating, setIsCelebrating] = useState(false)
  const previousDue = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (dueCount === undefined) return

    const justCleared = justClearedQueue(previousDue.current, dueCount)
    previousDue.current = dueCount

    if (!justCleared) return

    setIsCelebrating(true)
    const timer = setTimeout(() => setIsCelebrating(false), CELEBRATION_MS)

    return () => clearTimeout(timer)
  }, [dueCount])

  if (progress === undefined) {
    return (
      <CardShell>
        <div className="flex h-11.5 items-center gap-3">
          <Skeleton className="size-11.5 flex-none rounded-full" />
          <div className="min-w-0 grow space-y-1.75">
            <Skeleton className="h-2.75 w-3/4 rounded-sm" />
            <Skeleton className="h-2 w-1/2 rounded-sm" />
          </div>
        </div>
        <Skeleton className="h-8 w-full rounded-lg" />
      </CardShell>
    )
  }

  if (isCelebrating) {
    return (
      <CardShell isCelebrating>
        <Heading
          ring={
            <div className="relative size-11.5 flex-none">
              <ProgressRing percent={100}>
                <span
                  className="bg-primary text-primary-foreground flex size-7.5 items-center justify-center rounded-full motion-safe:animate-[follow-up-halo_0.8s_ease-out_0.08s_both]"
                  style={{
                    ['--halo' as string]:
                      'color-mix(in oklch, var(--color-primary) 40%, transparent)'
                  }}
                >
                  <span className="flex motion-safe:animate-[follow-up-pop_0.5s_cubic-bezier(0.2,1.35,0.4,1)_both] motion-reduce:animate-[follow-up-fade_0.18s_ease_both]">
                    <Check className="size-4" strokeWidth={2.7} />
                  </span>
                </span>
              </ProgressRing>
              <FollowUpBurst />
            </div>
          }
          title={
            <div className="text-foreground text-sm font-semibold">{m.followUp_allDone()}</div>
          }
          caption={m.followUp_noneTodayTagline()}
          isCelebrating
          fadeKey="celebrating"
        />
        <Button type="button" size="sm" disabled className="h-8 w-full text-xs font-semibold">
          {m.followUp_start()}
          <ArrowRight />
        </Button>
      </CardShell>
    )
  }

  if (!hasPipeline) {
    return (
      <CardShell>
        <Heading
          ring={
            <ProgressRing percent={0}>
              <span className="text-muted-foreground text-md font-semibold tabular-nums">0</span>
            </ProgressRing>
          }
          title={
            <div className="text-foreground text-sm font-semibold">
              {m.followUp_emptyPipeline()}
            </div>
          }
          caption={m.followUp_emptyPipelineTagline()}
          fadeKey="empty"
        />
        <Button
          type="button"
          size="sm"
          onClick={openCreate}
          className="h-8 w-full text-xs font-semibold"
        >
          {m.followUp_trackFirstContact()}
          <ArrowRight />
        </Button>
      </CardShell>
    )
  }

  if (progress.isComplete) {
    return (
      <CardShell>
        <Heading
          ring={
            <ProgressRing percent={0}>
              <Check className="text-muted-foreground size-4.75" strokeWidth={2.2} />
            </ProgressRing>
          }
          title={
            <div className="text-foreground text-sm font-semibold">{m.followUp_upToDate()}</div>
          }
          caption={m.followUp_noneTodayTagline()}
          fadeKey="idle"
        />
        <Button type="button" size="sm" disabled className="h-8 w-full text-xs font-semibold">
          {m.followUp_start()}
          <ArrowRight />
        </Button>
      </CardShell>
    )
  }

  return (
    <CardShell>
      <Heading
        ring={
          <ProgressRing percent={progress.percent}>
            <Bell className="text-primary size-4.5" />
          </ProgressRing>
        }
        title={
          <div className="text-foreground text-sm font-semibold">
            <NumberTicker value={progress.total - progress.done} /> {m.followUp_toContact()}
          </div>
        }
        caption={m.followUp_progressToday({ done: progress.done, total: progress.total })}
        fadeKey="active"
      />
      <Button
        type="button"
        size="sm"
        onClick={onStart}
        className="h-8 w-full text-xs font-semibold"
      >
        {m.followUp_start()}
        <ArrowRight />
      </Button>
    </CardShell>
  )
}
