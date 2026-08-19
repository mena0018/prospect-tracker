import type { Opportunity, Stage } from '@/db/schema'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

export const FIXTURE_STAGE_ID = '11111111-1111-4111-8111-111111111111'

export function makeStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: 'stage-contacted',
    userId: 'user-1',
    name: 'Contacté',
    color: 'blue',
    systemKey: 'contacted',
    position: 1,
    reminderDelayDays: 7,
    isArchived: false,
    createdAt: new Date(),
    ...overrides
  }
}

export function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opp-1',
    userId: 'user-1',
    stageId: 'stage-contacted',
    jobTypeId: null,
    experienceId: null,
    recruiter: 'Thomas Mercier',
    esn: null,
    endClient: null,
    need: null,
    dailyRate: null,
    onsiteDays: null,
    location: null,
    lastContactAt: null,
    nextReminderAt: null,
    phone: null,
    offerUrl: null,
    notes: null,
    isPinned: false,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

export function makeRow(overrides: Partial<OpportunityRow> = {}): OpportunityRow {
  const { stage, isDue, isArchivedRow, ...opportunity } = overrides

  return {
    ...makeOpportunity({ stageId: FIXTURE_STAGE_ID, recruiter: 'Camille', ...opportunity }),
    stage,
    isDue: isDue ?? false,
    isArchivedRow: isArchivedRow ?? false
  }
}
