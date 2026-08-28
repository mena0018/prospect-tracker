import type { Stage } from '@/db/schema'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

// Namespaces the drag, the way STAGES_LIST_ID does for the sortable lists.
export const BOARD_ID = 'opportunities'

export type BoardColumn = {
  stage: Stage
  cards: OpportunityRow[]
}

// Every active stage gets a column, including the empty ones: a board that hides them stops
// describing the pipeline. See docs/reference/kanban-view.md
export function toColumns(rows: OpportunityRow[], stages: Stage[]): BoardColumn[] {
  const columns = stages
    .filter((stage) => !stage.isArchived)
    .map((stage) => ({ stage, cards: [] as OpportunityRow[] }))

  const byStage = new Map(columns.map((column) => [column.stage.id, column]))

  // The rows arrive pinned-first then most recent, so pushing preserves both.
  for (const row of rows) byStage.get(row.stageId)?.cards.push(row)

  return columns
}
