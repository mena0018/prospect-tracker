import type { StageColorToken } from './schema'

// Not a global seed — copied per user on first login. See
// docs/decisions/0001-user-configurable-pipeline.md

// Annotated rather than inferred: this is what type-checks `color` against StageColorToken
type DefaultStage = {
  name: string
  color: StageColorToken
  position: number
  isArchived: boolean
  reminderDelayDays: number
}

// Per-stage from day one, so Personnaliser only has to write it — see docs/reference/data-model.md
const DEFAULT_REMINDER_DELAY_DAYS = 7

// Refusé/Ghosté are seeded archived so they stay out of the active kanban.
export const DEFAULT_STAGES: readonly DefaultStage[] = [
  {
    name: 'Sauvegardé',
    color: 'slate',
    position: 0,
    isArchived: false,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  },
  {
    name: 'Contacté',
    color: 'blue',
    position: 1,
    isArchived: false,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  },
  {
    name: 'CV Envoyé',
    color: 'amber',
    position: 2,
    isArchived: false,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  },
  {
    name: 'Entretien',
    color: 'violet',
    position: 3,
    isArchived: false,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  },
  {
    name: 'Offre',
    color: 'green',
    position: 4,
    isArchived: false,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  },
  {
    name: 'Refusé',
    color: 'red',
    position: 5,
    isArchived: true,
    reminderDelayDays: DEFAULT_REMINDER_DELAY_DAYS
  },
  {
    name: 'Ghosté',
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
