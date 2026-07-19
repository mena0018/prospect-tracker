import { describe, expect, it } from 'vitest'

import { getThemeScript, isTheme, resolveTheme } from './theme'

describe('isTheme', () => {
  it('accepts valid themes', () => {
    expect(isTheme('light')).toBe(true)
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('system')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isTheme('blue')).toBe(false)
    expect(isTheme(null)).toBe(false)
    expect(isTheme(undefined)).toBe(false)
    expect(isTheme(42)).toBe(false)
  })
})

describe('resolveTheme', () => {
  it('returns the theme as-is when not system', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('resolves system from the OS preference', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('getThemeScript', () => {
  it('embeds the storage key and default theme', () => {
    const script = getThemeScript('theme', 'system')
    expect(script).toContain('localStorage.getItem("theme")')
    expect(script).toContain('"system"')
  })

  it('applies the resolved class and color-scheme to documentElement', () => {
    const script = getThemeScript('theme', 'light')
    expect(script).toContain('classList.add(r)')
    expect(script).toContain('style.colorScheme=r')
  })

  it('is a self-invoking, error-guarded IIFE', () => {
    const script = getThemeScript('theme', 'dark')
    expect(script.startsWith('(function(){try{')).toBe(true)
    expect(script).toContain('catch(e){}')
  })
})
