import type { UseQueryResult } from '@tanstack/react-query'
import { ErrorState } from '@/components/error-state'

type Loaded<T> = { [K in keyof T]: T[K] extends UseQueryResult<infer D> ? D : never }

type Props<T extends readonly UseQueryResult[]> = {
  queries: readonly [...T]
  skeleton: React.ReactNode
  children: (data: Loaded<T>) => React.ReactNode
}

export function QueryGate<const T extends readonly UseQueryResult[]>({
  queries,
  skeleton,
  children
}: Props<T>) {
  const failed = queries.filter((query) => query.isError)

  if (failed.length > 0) {
    return (
      <ErrorState variant="slot" onRetry={() => failed.forEach((query) => void query.refetch())} />
    )
  }

  if (queries.some((query) => query.isPending)) return skeleton

  return children(queries.map((query) => query.data) as Loaded<T>)
}
