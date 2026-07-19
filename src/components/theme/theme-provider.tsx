// Pattern from https://ui.shadcn.com/docs/dark-mode/tanstack-start
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import { ScriptOnce } from '@tanstack/react-router'

import {
  applyTheme,
  DEFAULT_THEME,
  getThemeScript,
  isTheme,
  THEME_STORAGE_KEY,
  type Theme
} from '@/lib/theme'

type ThemeProviderState = {
  theme: Theme
  toggleTheme: () => void
}
const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

type Props = PropsWithChildren<
  Partial<{
    defaultTheme: Theme
    storageKey: string
  }>
>

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = THEME_STORAGE_KEY
}: Props) {
  const [theme, setThemeState] = useState(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    setThemeState(isTheme(stored) ? stored : defaultTheme)
    setMounted(true)
  }, [defaultTheme, storageKey])

  useEffect(() => {
    if (!mounted) return
    applyTheme(theme)
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted || theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme, mounted])

  const setTheme = (next: Theme) => {
    localStorage.setItem(storageKey, next)
    applyTheme(next)
    setThemeState(next)
  }

  const toggleTheme = () => {
    setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')
  }

  return (
    <ThemeProviderContext value={{ theme, toggleTheme }}>
      <ScriptOnce>{getThemeScript(storageKey, defaultTheme)}</ScriptOnce>
      {children}
    </ThemeProviderContext>
  )
}

export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
