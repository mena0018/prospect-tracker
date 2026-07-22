import type { STAGE_COLOR_TOKENS } from './schema'

// Not a global seed — copied per user on first login. See
// docs/decisions/0001-user-configurable-pipeline.md

type StageColorToken = (typeof STAGE_COLOR_TOKENS)[number]

export type DefaultStage = {
  name: string
  color: StageColorToken
  position: number
  isArchived: boolean
}

export type DefaultJobType = {
  name: string
  position: number
}

export type DefaultExperienceLevel = {
  name: string
  position: number
}

// Refusé/Ghosté are seeded archived so they stay out of the active kanban.
export const DEFAULT_STAGES: readonly DefaultStage[] = [
  { name: 'Sauvegardé', color: 'slate', position: 0, isArchived: false },
  { name: 'Contacté', color: 'blue', position: 1, isArchived: false },
  { name: 'CV Envoyé', color: 'teal', position: 2, isArchived: false },
  { name: 'Entretien', color: 'violet', position: 3, isArchived: false },
  { name: 'Offre', color: 'green', position: 4, isArchived: false },
  { name: 'Refusé', color: 'red', position: 5, isArchived: true },
  { name: 'Ghosté', color: 'orange', position: 6, isArchived: true }
] as const

export const DEFAULT_JOB_TYPES: readonly DefaultJobType[] = [
  { name: 'FullStack', position: 0 },
  { name: 'Front End', position: 1 },
  { name: 'Back End', position: 2 },
  { name: 'Mobile', position: 3 },
  { name: 'DevOps', position: 4 },
  { name: 'Data', position: 5 }
] as const

export const DEFAULT_EXPERIENCE_LEVELS: readonly DefaultExperienceLevel[] = [
  { name: 'Junior', position: 0 },
  { name: 'Confirmé', position: 1 },
  { name: 'Senior', position: 2 }
] as const
