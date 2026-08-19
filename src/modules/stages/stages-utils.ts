import { STAGE_COLOR_TOKENS, type Stage, type StageColorToken } from '@/db/schema'

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
