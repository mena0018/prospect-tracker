import { QueryGate } from '@/components/query-gate'
import { DEFAULT_EXPERIENCE_LEVELS, DEFAULT_JOB_TYPES } from '@/db/defaults'
import {
  DailyRateCard,
  DailyRateCardSkeleton
} from '@/modules/customization/components/daily-rate-card'
import { StagesCard, StagesCardSkeleton } from '@/modules/customization/components/stages-card'
import { useDailyRateReference } from '@/modules/customization/hooks/use-daily-rate-reference'
import {
  ExperienceLevelsCard,
  ExperienceLevelsCardSkeleton
} from '@/modules/experience-levels/components/experience-levels-card'
import { useExperienceLevelCounts } from '@/modules/experience-levels/hooks/use-experience-level-counts'
import { useExperienceLevels } from '@/modules/experience-levels/hooks/use-experience-levels'
import { JobTypesCard, JobTypesCardSkeleton } from '@/modules/job-types/components/job-types-card'
import { useJobTypeCounts } from '@/modules/job-types/hooks/use-job-type-counts'
import { useJobTypes } from '@/modules/job-types/hooks/use-job-types'
import { useStageCounts } from '@/modules/stages/hooks/use-stage-counts'
import { useStages } from '@/modules/stages/hooks/use-stages'

export function CustomizationPanel() {
  const stagesQuery = useStages()
  const jobTypesQuery = useJobTypes()
  const levelsQuery = useExperienceLevels()
  const stageCountsQuery = useStageCounts()
  const jobTypeCountsQuery = useJobTypeCounts()
  const dailyRateQuery = useDailyRateReference()
  const levelCountsQuery = useExperienceLevelCounts()

  return (
    <div className="-mx-6.5 -my-5.5 min-h-0 flex-1 overflow-y-auto px-6.5 py-5.5">
      <div className="mx-auto flex w-full max-w-400 flex-col gap-5.5 pb-10">
        <QueryGate queries={[dailyRateQuery]} skeleton={<DailyRateCardSkeleton />}>
          {([dailyRate]) => <DailyRateCard dailyRateReference={dailyRate.dailyRateReference} />}
        </QueryGate>

        <QueryGate queries={[stagesQuery, stageCountsQuery]} skeleton={<StagesCardSkeleton />}>
          {([stages, stageCounts]) => (
            <StagesCard
              stages={stages}
              counts={new Map(stageCounts.stages.map(({ id, count }) => [id, count]))}
            />
          )}
        </QueryGate>

        <div className="grid grid-cols-1 gap-5.5 lg:grid-cols-2">
          <QueryGate
            queries={[jobTypesQuery, jobTypeCountsQuery]}
            skeleton={<JobTypesCardSkeleton rowCount={DEFAULT_JOB_TYPES.length} />}
          >
            {([jobTypes, counts]) => <JobTypesCard jobTypes={jobTypes} counts={counts} />}
          </QueryGate>

          <QueryGate
            queries={[levelsQuery, levelCountsQuery]}
            skeleton={<ExperienceLevelsCardSkeleton rowCount={DEFAULT_EXPERIENCE_LEVELS.length} />}
          >
            {([experienceLevels, counts]) => (
              <ExperienceLevelsCard experienceLevels={experienceLevels} counts={counts} />
            )}
          </QueryGate>
        </div>
      </div>
    </div>
  )
}

export function CustomizationPanelSkeleton() {
  return (
    <div className="-mx-6.5 -my-5.5 min-h-0 flex-1 overflow-y-auto px-6.5 py-5.5">
      <div className="mx-auto flex w-full max-w-400 flex-col gap-5.5 pb-10">
        <DailyRateCardSkeleton />
        <StagesCardSkeleton />

        <div className="grid grid-cols-1 gap-5.5 lg:grid-cols-2">
          <JobTypesCardSkeleton rowCount={DEFAULT_JOB_TYPES.length} />
          <ExperienceLevelsCardSkeleton rowCount={DEFAULT_EXPERIENCE_LEVELS.length} />
        </div>
      </div>
    </div>
  )
}
