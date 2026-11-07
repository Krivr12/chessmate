import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEFAULT_DIFFICULTY } from '@/constants'
import type { Difficulty } from '@/constants'

export type ThemeSetting = 'dark' | 'light' | 'system'
export type DefaultColor = 'w' | 'b' | 'random'

export type Settings = {
  theme: ThemeSetting
  sound: boolean
  haptics: boolean
  showHints: boolean
  showPuzzleIntro: boolean
  highlightLastMove: boolean
  defaultDifficulty: Difficulty
  defaultColor: DefaultColor
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  sound: false, // stays off until M22 adds the sound effects
  haptics: false, // stays off until M22 adds haptics
  showHints: true,
  showPuzzleIntro: true,
  highlightLastMove: true,
  defaultDifficulty: DEFAULT_DIFFICULTY,
  defaultColor: 'w',
}

export const SETTINGS_KEY = 'chessmate:settings'

type SettingsState = Settings & {
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

/**
 * User preferences, stored in localStorage so they are readable synchronously at boot
 * (the theme must not flash). Battle and history data live in IndexedDB, not here.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: SETTINGS_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Keep only known keys, so a corrupt or hand-edited value falls back to defaults.
      partialize: (s) => ({
        theme: s.theme,
        sound: s.sound,
        haptics: s.haptics,
        showHints: s.showHints,
        showPuzzleIntro: s.showPuzzleIntro,
        highlightLastMove: s.highlightLastMove,
        defaultDifficulty: s.defaultDifficulty,
        defaultColor: s.defaultColor,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Settings>
        return {
          ...current,
          theme: isOneOf(p.theme, ['dark', 'light', 'system']) ? p.theme : current.theme,
          sound: typeof p.sound === 'boolean' ? p.sound : current.sound,
          haptics: typeof p.haptics === 'boolean' ? p.haptics : current.haptics,
          showHints: typeof p.showHints === 'boolean' ? p.showHints : current.showHints,
          showPuzzleIntro: typeof p.showPuzzleIntro === 'boolean' ? p.showPuzzleIntro : current.showPuzzleIntro,
          highlightLastMove:
            typeof p.highlightLastMove === 'boolean' ? p.highlightLastMove : current.highlightLastMove,
          defaultDifficulty: isOneOf(p.defaultDifficulty, ['easy', 'medium', 'hard'])
            ? p.defaultDifficulty
            : current.defaultDifficulty,
          defaultColor: isOneOf(p.defaultColor, ['w', 'b', 'random']) ? p.defaultColor : current.defaultColor,
        }
      },
    },
  ),
)

function isOneOf<T extends string>(v: unknown, options: readonly T[]): v is T {
  return typeof v === 'string' && (options as readonly string[]).includes(v)
}
