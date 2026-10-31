import { useSyncExternalStore } from 'react'
import { useSettingsStore, type ThemeSetting } from './settings-store'
import { useThemeLock, type ResolvedTheme } from './theme-lock'

export type { ResolvedTheme } from './theme-lock'

const LIGHT_QUERY = '(prefers-color-scheme: light)'

export function systemPrefersLight(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(LIGHT_QUERY).matches
}

/**
 * The one rule for which theme is shown (plan section 4.4).
 * A battle's lock wins. Otherwise the Settings choice applies, and 'system' follows the device.
 * While locked, device changes are ignored and apply once the lock is released.
 */
export function effectiveTheme(
  lock: ResolvedTheme | null,
  setting: ThemeSetting,
  systemLight: boolean,
): ResolvedTheme {
  if (lock) return lock
  if (setting === 'dark' || setting === 'light') return setting
  return systemLight ? 'light' : 'dark'
}

/** Theme a new battle locks to, from the current Settings and device. */
export function resolveTheme(setting: ThemeSetting): ResolvedTheme {
  return effectiveTheme(null, setting, systemPrefersLight())
}

function subscribeSystem(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const query = window.matchMedia(LIGHT_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** The theme the whole app renders right now. */
export function useEffectiveTheme(): ResolvedTheme {
  const lock = useThemeLock((s) => s.lockedTheme)
  const setting = useSettingsStore((s) => s.theme)
  const systemLight = useSyncExternalStore(subscribeSystem, systemPrefersLight, () => false)
  return effectiveTheme(lock, setting, systemLight)
}
