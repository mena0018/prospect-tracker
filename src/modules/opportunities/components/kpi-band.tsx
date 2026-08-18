import { Bell, CalendarDays, Clock, Percent } from 'lucide-react'
import type { ComponentType } from 'react'

import { NumberTicker } from '@/components/ui/number-ticker'
import { Skeleton } from '@/components/ui/skeleton'
import { m } from '@/i18n/paraglide/messages'
import { cn, formatValue } from '@/lib/utils'
import type { Kpis } from '@/modules/opportunities/opportunities-server'

const BAND_LAYOUT = 'mb-5.5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'
const CARD_LAYOUT = 'bg-card min-h-30.5 rounded-xl border p-4.5 shadow-xs dark:shadow-none'
const CARD_COUNT = 4

type Props = {
  label: string
  value: number | null
  suffix?: string
  /** Only the lead KPI counts up — see docs/reference/number-ticker.md */
  animated?: boolean
  unit?: string
  isAlert?: boolean
  icon: ComponentType<{ className?: string }>
}

function KpiCard({ label, value, suffix, animated, unit, icon: Icon, isAlert = false }: Props) {
  const valueClassName = cn(
    'text-3xl leading-none font-semibold tracking-tight tabular-nums',
    isAlert ? 'text-destructive' : 'text-foreground'
  )

  return (
    <div className={cn(CARD_LAYOUT, isAlert ? 'border-destructive/25' : 'border-border')}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-secondary-foreground font-medium">{label}</span>
        <span
          className={cn(
            'flex size-6.5 flex-none items-center justify-center rounded-lg',
            isAlert
              ? 'bg-destructive/12 text-destructive'
              : 'bg-secondary text-secondary-foreground'
          )}
        >
          <Icon className="size-3.75" />
        </span>
      </div>
      <div className="mt-4.5 flex items-baseline gap-2">
        {animated ? (
          <NumberTicker value={value} suffix={suffix} className={valueClassName} />
        ) : (
          <span className={valueClassName}>{formatValue(value, suffix)}</span>
        )}
        {unit && <span className="text-muted-foreground text-xs">{unit}</span>}
      </div>
    </div>
  )
}

export function KpiBand({ kpis }: { kpis: Kpis }) {
  return (
    <div className={BAND_LAYOUT}>
      <KpiCard
        animated
        icon={Bell}
        isAlert={kpis.dueToday > 0}
        label={m.kpi_dueToday()}
        value={kpis.dueToday}
        unit={m.kpi_dueTodayUnit()}
      />
      <KpiCard icon={Clock} label={m.kpi_stale()} value={kpis.stale} unit={m.kpi_staleUnit()} />
      <KpiCard
        icon={CalendarDays}
        label={m.kpi_interviews()}
        value={kpis.interviews}
        unit={m.kpi_interviewsUnit()}
      />
      <KpiCard icon={Percent} label={m.kpi_responseRate()} value={kpis.responseRate} suffix="%" />
    </div>
  )
}

export function KpiBandSkeleton() {
  return (
    <div className={BAND_LAYOUT}>
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <div key={index} className={cn(CARD_LAYOUT, 'border-border')}>
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="size-6.5 flex-none rounded-lg" />
          </div>
          <div className="mt-4.5 flex items-baseline gap-2">
            <Skeleton className="h-7.5 w-12" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  )
}
