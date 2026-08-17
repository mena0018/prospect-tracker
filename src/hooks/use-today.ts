import { useSyncExternalStore } from 'react'

// Midnight scheduling, SSR and the visibility fallback: docs/reference/today.md
function todayIso() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}

function msUntilNextMidnight() {
  const now = new Date()
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  return midnight.getTime() - now.getTime()
}

let today = todayIso()
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | null = null

function publishIfDayChanged() {
  const next = todayIso()
  if (next === today) return

  today = next
  for (const listener of listeners) listener()
}

function scheduleMidnight() {
  timer = setTimeout(() => {
    publishIfDayChanged()
    scheduleMidnight()
  }, msUntilNextMidnight() + 1000)
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') publishIfDayChanged()
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  if (listeners.size === 1) {
    scheduleMidnight()
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  return () => {
    listeners.delete(listener)

    if (listeners.size === 0) {
      if (timer) clearTimeout(timer)
      timer = null
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }
}

const getServerSnapshot = () => today

export function useToday() {
  return useSyncExternalStore(subscribe, () => today, getServerSnapshot)
}
