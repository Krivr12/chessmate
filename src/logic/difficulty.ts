import type { Difficulty } from './types'

export type DifficultyConfig = {
  label: string
  /** Engine strength as a percent of the strongest setting (shown on the New game sheet). */
  strength: number
  /** UCI_Elo when limiting strength; null uses Skill Level instead. */
  elo: number | null
  skill: number
  /** Search limit for the opponent's move. */
  go: string
}

/** Starting values from README §9. Stockfish's minimum UCI_Elo is about 1320. */
export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { label: 'Easy', strength: 10, elo: null, skill: 2, go: 'go depth 4' },
  medium: { label: 'Medium', strength: 50, elo: 1500, skill: 20, go: 'go movetime 400' },
  hard: { label: 'Hard', strength: 100, elo: 2100, skill: 20, go: 'go movetime 800' },
}

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard']

export const isDifficulty = (v: unknown): v is Difficulty =>
  v === 'easy' || v === 'medium' || v === 'hard'
