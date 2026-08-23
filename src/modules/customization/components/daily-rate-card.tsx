import { Label } from '@/components/ui/label'
import { m } from '@/i18n/paraglide/messages'
import { Skeleton } from '@/components/ui/skeleton'
import { CONFIG } from '@/lib/config'
import { CommittedNumberInput } from '@/modules/customization/components/committed-number-input'
import { CustomizationCard } from '@/modules/customization/components/customization-card'
import { useDailyRateReferenceMutation } from '@/modules/customization/hooks/use-daily-rate-reference-mutations'

const DAILY_RATE_MAX = 10000

type Props = {
  dailyRateReference: number
}

export function DailyRateCard({ dailyRateReference }: Props) {
  const { update } = useDailyRateReferenceMutation()

  return (
    <CustomizationCard
      title={m.customize_dailyRateSectionTitle()}
      hint={m.customize_dailyRateSectionHint()}
      bodyClassName="flex-row flex-wrap items-center gap-4"
    >
      <div className="relative w-37.5 flex-none">
        <Label htmlFor="daily-rate-reference" className="sr-only">
          {m.customize_dailyRateLabel()}
        </Label>
        <CommittedNumberInput
          id="daily-rate-reference"
          min={0}
          max={DAILY_RATE_MAX}
          value={dailyRateReference}
          onCommit={(dailyRateReference) => update.mutate({ dailyRateReference })}
          className="text-md h-11 pr-8.5 font-semibold tabular-nums"
        />
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm">
          {CONFIG.currencySymbol}
        </span>
      </div>

      <div className="flex flex-col gap-1.25 text-xs">
        <span className="text-rate-above font-semibold">{m.customize_dailyRateAbove()}</span>
        <span className="text-rate-below font-semibold">{m.customize_dailyRateBelow()}</span>
      </div>
    </CustomizationCard>
  )
}

export function DailyRateCardSkeleton() {
  return (
    <CustomizationCard
      title={m.customize_dailyRateSectionTitle()}
      hint={m.customize_dailyRateSectionHint()}
      bodyClassName="flex-row flex-wrap items-center gap-4"
    >
      <Skeleton className="h-11 w-37.5 flex-none rounded-md" />
      <div className="flex flex-col gap-1.25">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-32" />
      </div>
    </CustomizationCard>
  )
}
