import { beforeEach, describe, expect, it, vi } from 'vitest'

// A small in-memory localStorage, so the lock and the settings store can run in the Node test env.
function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size
    },
  }
}

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('localStorage', memoryStorage())
})

describe('effectiveTheme', () => {
  it('a battle lock wins over Settings and the device', async () => {
    const { effectiveTheme } = await import('./theme')
    expect(effectiveTheme('dark', 'light', true)).toBe('dark')
    expect(effectiveTheme('light', 'dark', false)).toBe('light')
    expect(effectiveTheme('dark', 'system', true)).toBe('dark')
  })

  it('uses the Settings choice when nothing is locked', async () => {
    const { effectiveTheme } = await import('./theme')
    expect(effectiveTheme(null, 'dark', true)).toBe('dark')
    expect(effectiveTheme(null, 'light', false)).toBe('light')
  })

  it('follows the device for System', async () => {
    const { effectiveTheme } = await import('./theme')
    expect(effectiveTheme(null, 'system', true)).toBe('light')
    expect(effectiveTheme(null, 'system', false)).toBe('dark')
  })
})

describe('theme lock', () => {
  it('lock and unlock write and clear the mirrored key used by the inline script', async () => {
    const { useThemeLock, THEME_LOCK_KEY } = await import('./theme-lock')
    useThemeLock.getState().lock('light')
    expect(useThemeLock.getState().lockedTheme).toBe('light')
    expect(localStorage.getItem(THEME_LOCK_KEY)).toBe('light')

    useThemeLock.getState().unlock()
    expect(useThemeLock.getState().lockedTheme).toBeNull()
    expect(localStorage.getItem(THEME_LOCK_KEY)).toBeNull()
  })

  it('reads an existing lock at startup', async () => {
    localStorage.setItem('chessmate:theme-lock', 'light')
    const { useThemeLock } = await import('./theme-lock')
    expect(useThemeLock.getState().lockedTheme).toBe('light')
  })

  it('ignores a corrupt lock value', async () => {
    localStorage.setItem('chessmate:theme-lock', 'purple')
    const { useThemeLock } = await import('./theme-lock')
    expect(useThemeLock.getState().lockedTheme).toBeNull()
  })
})

describe('settings store', () => {
  it('falls back to defaults for invalid stored values and keeps valid ones', async () => {
    localStorage.setItem(
      'chessmate:settings',
      JSON.stringify({
        state: { theme: 'neon', sound: 'yes', showHints: false, defaultDifficulty: 'hard', defaultColor: 'b' },
        version: 1,
      }),
    )
    const { useSettingsStore, DEFAULT_SETTINGS } = await import('./settings-store')
    await useSettingsStore.persist.rehydrate()
    const s = useSettingsStore.getState()
    expect(s.theme).toBe(DEFAULT_SETTINGS.theme) // 'neon' is not a theme
    expect(s.sound).toBe(DEFAULT_SETTINGS.sound) // 'yes' is not a boolean
    expect(s.showHints).toBe(false) // valid value is kept
    expect(s.defaultDifficulty).toBe('hard')
    expect(s.defaultColor).toBe('b')
  })

  it('persists changes to localStorage', async () => {
    const { useSettingsStore } = await import('./settings-store')
    useSettingsStore.getState().update({ theme: 'light' })
    expect(JSON.parse(localStorage.getItem('chessmate:settings') ?? '{}').state.theme).toBe('light')
  })
})
