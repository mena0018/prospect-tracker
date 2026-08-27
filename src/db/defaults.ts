import type { StageColorToken, StageSystemKey } from './schema'

// Not a global seed — copied per user on first login. See
// docs/decisions/0001-user-configurable-pipeline.md

// Annotated rather than inferred: this is what type-checks `color` against StageColorToken
type DefaultStage = {
  name: string
  color: StageColorToken
  systemKey: StageSystemKey
  position: number
  isArchived: boolean
  reminderDelayDays: number
}

// Per-stage from day one, so Personnaliser only has to write it — see docs/reference/data-model.md
const DEFAULT_REMINDER_DELAY_DAYS = 7

// Refusé ships active: rejection is the common outcome and needs somewhere to go. Ghosté ships
// archived — it is noticed weeks later, not moved into. See docs/reference/data-model.md
export const DEFAULT_STAGES: readonly DefaultStage[] = [
  {
    name: 'Sauvegardé',
    systemKey: 'saved',
    color: 'slate',
    position: 0,
    isArchived: false,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  },
  {
    name: 'Contacté',
    systemKey: 'contacted',
    color: 'blue',
    position: 1,
    isArchived: false,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  },
  {
    name: 'Dossier envoyé',
    systemKey: 'cv_sent',
    color: 'amber',
    position: 2,
    isArchived: false,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  },
  {
    name: 'Entretien',
    systemKey: 'interview',
    color: 'violet',
    position: 3,
    isArchived: false,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  },
  {
    name: 'Proposition',
    systemKey: 'offer',
    color: 'green',
    position: 4,
    isArchived: false,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  },
  {
    name: 'Refusé',
    systemKey: 'rejected',
    color: 'red',
    position: 5,
    isArchived: false,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  },
  {
    name: 'Ghosté',
    systemKey: 'ghosted',
    color: 'rose',
    position: 6,
    isArchived: true,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  }
] as const

export const DEFAULT_JOB_TYPES = [
  { name: 'FullStack', position: 0 },
  { name: 'Front End', position: 1 },
  { name: 'Back End', position: 2 },
  { name: 'Mobile', position: 3 },
  { name: 'DevOps', position: 4 },
  { name: 'Data', position: 5 }
] as const

export const DEFAULT_EXPERIENCE_LEVELS = [
  { name: 'Junior', position: 0 },
  { name: 'Confirmé', position: 1 },
  { name: 'Senior', position: 2 }
] as const

export const DEFAULT_TJM_REFERENCE = 450
