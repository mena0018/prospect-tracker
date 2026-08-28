// Shared shapes for a column board — see docs/reference/board-mechanism.md

// The row scrolls horizontally; each column scrolls on its own, so the page itself never does.
export const BOARD_LAYOUT = 'flex min-h-0 flex-1 gap-3.5 overflow-x-auto overflow-y-hidden p-4.5'

// Fixed width: columns must not shrink to nothing as the pipeline grows, which is what makes the
// horizontal scroll meaningful rather than an accident.
export const COLUMN_LAYOUT =
  'bg-secondary/50 border-border-soft flex w-72 flex-none flex-col rounded-xl border'

export const COLUMN_HEADER_LAYOUT =
  'flex flex-none items-center gap-2 px-3.25 pt-3.25 pb-2.5 text-sm font-semibold'

export const COLUMN_SCROLLER_LAYOUT =
  'flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-2.5 pb-2.5'

// A named shadow, not an arbitrary one: `hover:shadow-md` has to win over the resting shadow, and
// twMerge keeps both when their utility shapes differ.
export const CARD_LAYOUT =
  'group/card border-border bg-card relative flex flex-col gap-2 rounded-lg border p-3 text-left shadow-xs'
