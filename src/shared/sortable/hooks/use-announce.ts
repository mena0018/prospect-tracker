import { useEffect, useRef, useState } from 'react'

// Screen-reader announcements — see docs/reference/sortable-mechanism.md
export function useAnnounce() {
  const [message, setMessage] = useState('')
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timeout.current), [])

  const announce = (next: string) => {
    clearTimeout(timeout.current)
    setMessage(next)
    timeout.current = setTimeout(() => setMessage(''), 1000)
  }

  return { message, announce }
}
