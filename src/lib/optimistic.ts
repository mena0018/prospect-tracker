import type { QueryClient, QueryKey } from '@tanstack/react-query'

type Context<T> = { previous: T[] | undefined }

export async function optimisticList<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  apply: (current: T[]) => T[]
): Promise<Context<T>> {
  await queryClient.cancelQueries({ queryKey })
  const previous = queryClient.getQueryData<T[]>(queryKey)

  if (previous) queryClient.setQueryData<T[]>(queryKey, apply(previous))

  return { previous }
}

export function rollbackList<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  context: Context<T> | undefined
) {
  if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
}
