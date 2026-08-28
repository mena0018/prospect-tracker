import { STAGE_COLOR_TOKENS, type Stage, type StageColorToken } from '@/db/schema'

// Namespaces the drag so two sortable lists on one page cannot accept each other's rows.
export const STAGES_LIST_ID = 'stages'

export type StageIndex = Map<string, Stage>

export function indexStages(stages: Stage[]): StageIndex {
  return new Map(stages.map((stage) => [stage.id, stage]))
}

function isStageColorToken(color: string): color is StageColorToken {
  return (STAGE_COLOR_TOKENS as readonly string[]).includes(color)
}

// Palette declared in src/styles/globals.css — see docs/reference/data-model.md.
export function stageColorVar(color: string) {
  return `var(--stage-${isStageColorToken(color) ? color : 'slate'})`
}

// First unused token, so consecutive adds stay distinguishable; falls back once all ten are used.
export function nextFreeStageColor(used: readonly string[]): StageColorToken {
  return STAGE_COLOR_TOKENS.find((token) => !used.includes(token)) ?? 'slate'
}

export type FollowUpProgress = {
  done: number
  total: number
  percent: number
  isComplete: boolean
}

// The total holds still for the day while the bar fills — see docs/reference/kpis.md
export function followUpProgress(
  dueCount: number | undefined,
  doneToday: number | undefined
): FollowUpProgress | undefined {
  if (dueCount === undefined || doneToday === undefined) return undefined

  const total = dueCount + doneToday

  return {
    done: doneToday,
    total,
    percent: total === 0 ? 100 : Math.round((doneToday / total) * 100),
    isComplete: dueCount === 0
  }
}

// A transition to an empty queue, never the state itself — see docs/reference/kpis.md
export function justClearedQueue(previousDue: number | undefined, dueCount: number | undefined) {
  return previousDue !== undefined && previousDue > 0 && dueCount === 0
}

// Archived stages hold no order, so they trail the active ones and a restored stage lands at the
// end of the pipeline — see docs/reference/customization.md
export function orderActiveFirst(ids: string[], archivedIds: ReadonlySet<string>) {
  return [...ids.filter((id) => !archivedIds.has(id)), ...ids.filter((id) => archivedIds.has(id))]
}

// An archived stage is a column the user put away: it is not offered as a destination. The one
// exception is the stage the edited opportunity already sits in — filtering it out would blank
// the picker and silently move the row on save. See docs/reference/opportunity-form.md
export function selectableStages(stages: Stage[], currentStageId: string | undefined) {
  return stages.filter((stage) => !stage.isArchived || stage.id === currentStageId)
}

export function countStages(stages: Stage[]) {
  const active = stages.filter((stage) => !stage.isArchived).length

  return { active, archived: stages.length - active }
}
