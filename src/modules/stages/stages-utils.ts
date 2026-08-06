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
