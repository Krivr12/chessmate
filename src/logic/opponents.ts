import { chickenTalk, trashTalk, type TrashTalkBank } from './trash-talk'
import type { Difficulty } from './types'

export type OpponentId = 'frog' | 'chicken'

export type Opponent = {
  id: OpponentId
  /** Name shown in headers, copy, and aria labels. */
  name: string
  /** Friendly name for each difficulty level (D8). */
  difficultyNames: Record<Difficulty, string>
  /** This opponent's own word bank (D2). */
  lines: TrashTalkBank
}

export const OPPONENTS: Record<OpponentId, Opponent> = {
  frog: {
    id: 'frog',
    name: 'Frog',
    difficultyNames: { easy: 'Sleepy', medium: 'Regular', hard: 'Big brain' },
    lines: trashTalk,
  },
  chicken: {
    id: 'chicken',
    name: 'Chicken',
    difficultyNames: { easy: 'Chick', medium: 'Hen', hard: 'Rooster' },
    lines: chickenTalk,
  },
}

/** The theme decides the animal: dark = frog, light = chicken (D1). */
export const opponentForTheme = (resolved: 'dark' | 'light'): OpponentId =>
  resolved === 'dark' ? 'frog' : 'chicken'

/** Old MVP saves have no opponent field, so they resume as the frog. */
export const opponentOrDefault = (id: unknown): OpponentId =>
  id === 'frog' || id === 'chicken' ? id : 'frog'
