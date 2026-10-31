import { create } from 'zustand'

export type ResolvedTheme = 'dark' | 'light'

/**
 * While an unfinished battle exists, the app stays in the battle's theme (D2).
 * The lock is also mirrored to localStorage, so the inline script in index.html can apply
 * it before React loads and the first paint never shows the wrong theme.
 */
export const THEME_LOCK_KEY = 'chessmate:theme-lock'

function readLock(): ResolvedTheme | null {
  try {
    const v = localStorage.getItem(THEME_LOCK_KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

function writeLock(theme: ResolvedTheme | null) {
  try {
    if (theme) localStorage.setItem(THEME_LOCK_KEY, theme)
    else localStorage.removeItem(THEME_LOCK_KEY)
  } catch {
    // Storage can be unavailable. The in-memory lock still works for this session.
  }
}

type ThemeLockState = {
  /** Theme of the battle in progress, or null when no battle is locking the theme. */
  lockedTheme: ResolvedTheme | null
  lock: (theme: ResolvedTheme) => void
  unlock: () => void
}

export const useThemeLock = create<ThemeLockState>()((set) => ({
  lockedTheme: readLock(),
  lock: (theme) => {
    writeLock(theme)
    set({ lockedTheme: theme })
  },
  unlock: () => {
    writeLock(null)
    set({ lockedTheme: null })
  },
}))
