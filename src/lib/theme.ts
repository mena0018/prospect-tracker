type ResolvedTheme = 'light' | 'dark'
export type Theme = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'theme'
export const DEFAULT_THEME: Theme = 'system'

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function resolveTheme(theme: Theme, systemPrefersDark: boolean): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark ? 'dark' : 'light'
  return theme
}

export function getThemeScript(storageKey: string, defaultTheme: Theme): string {
  const key = JSON.stringify(storageKey)
  const fallback = JSON.stringify(defaultTheme)
  return `(function(){try{var t=localStorage.getItem(${key});if(t!=='light'&&t!=='dark'&&t!=='system'){t=${fallback}}var d=matchMedia('(prefers-color-scheme: dark)').matches;var r=t==='system'?(d?'dark':'light'):t;var e=document.documentElement;e.classList.add(r);e.style.colorScheme=r}catch(e){}})();`
}

export function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme, window.matchMedia('(prefers-color-scheme: dark)').matches)
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  root.style.colorScheme = resolved
}
