import type { ThemeSetting } from './settings-store'

export type ResolvedTheme = 'dark' | 'light'

/** Turns the Settings choice into a concrete theme. 'system' follows the device. */
export function resolveTheme(setting: ThemeSetting): ResolvedTheme {
  if (setting === 'dark' || setting === 'light') return setting
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}
