export function moveInList<T>(items: readonly T[], from: number, direction: -1 | 1): T[] {
  const to = from + direction
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return [...items]

  const next = [...items]
  const moved = next[from]
  const displaced = next[to]
  if (moved === undefined || displaced === undefined) return next

  next[from] = displaced
  next[to] = moved

  return next
}

export function moveToEdge<T>(items: readonly T[], from: number, edge: 'top' | 'bottom'): T[] {
  const moved = items[from]
  if (moved === undefined) return [...items]

  const rest = items.filter((_, index) => index !== from)

  return edge === 'top' ? [moved, ...rest] : [...rest, moved]
}

export function nextPosition(items: readonly { position: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.position + 1), 0)
}
