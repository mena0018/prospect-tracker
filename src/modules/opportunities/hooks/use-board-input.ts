import { useSearch } from '@tanstack/react-router'

import { Route } from '@/routes/_authed/app.index'
import { useToday } from '@/hooks/use-today'
import { toBoardInput } from '@/modules/opportunities/utils/search-input'
import type { GetBoardInput } from '@/modules/opportunities/opportunities-schema'

export function useBoardInput(): GetBoardInput {
  return toBoardInput(useSearch({ from: Route.id }), useToday())
}
