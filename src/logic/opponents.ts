import type { Difficulty } from './types'

/** Opponent ids. Only 'frog' is live until M21 adds the chicken. */
export type OpponentId = 'frog' | 'chicken'

export type Opponent = {
  id: OpponentId
  /** Name shown in headers, copy, and aria labels. */
  name: string
  /** Friendly name for each difficulty level. */
  difficultyNames: Record<Difficulty, string>
}

export const OPPONENTS: Record<OpponentId, Opponent> = {
  frog: {
    id: 'frog',
    name: 'Frog',
    difficultyNames: { easy: 'Sleepy', medium: 'Regular', hard: 'Big brain' },
  },
  // Placeholder so the type stays complete. M21 replaces it with the real chicken names (D8).
  chicken: {
    id: 'chicken',
    name: 'Chicken',
    difficultyNames: { easy: 'Chick', medium: 'Hen', hard: 'Rooster' },
  },
}

/** The theme decides the animal: dark = frog, light = chicken (D1). */
export const opponentForTheme = (resolved: 'dark' | 'light'): OpponentId =>
  resolved === 'dark' ? 'frog' : 'chicken'

/** Old MVP saves have no opponent field, so they resume as the frog. */
export const opponentOrDefault = (id: unknown): OpponentId =>
  id === 'frog' || id === 'chicken' ? id : 'frog'
