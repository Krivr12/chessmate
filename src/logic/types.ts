import type { Color, PieceSymbol, Square } from 'chess.js'
import type { Difficulty } from '@/constants'
import type { OpponentId } from './opponents'

export type { Difficulty }

export type Grade = 'best' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'

export type Mood = 'idle' | 'think' | 'happy' | 'sad' | 'shock' | 'angry'

export type MoveRecord = {
  from: Square
  to: Square
  promotion?: PieceSymbol
  san: string
  by: 'player' | 'opponent'
  /** Player's win % before this move (player moves only). */
  winBefore?: number
  /** Player's win % after this move. */
  winAfter?: number
  grade?: Grade
  /** Engine evaluation after this move, from the player's point of view (centipawns). */
  cp?: number
  /** Mate in N after this move, from the player's point of view. Set instead of cp when mate is found. */
  mate?: number
  /** Engine's best move (UCI) before a player move. Used for review and the accuracy check. */
  bestBefore?: string
}

export type Outcome = {
  result: 'win' | 'loss' | 'draw'
  reason: string
}

export type SavedBattle = {
  version: 1
  startFen: string
  moves: MoveRecord[]
  playerColor: Color
  difficulty: Difficulty
  /** Added in Phase 2. Missing in MVP saves, which mean 'frog'. */
  opponent: OpponentId
  /** Resolved theme when the battle started. Missing in MVP saves, which mean 'dark'. */
  theme: 'dark' | 'light'
  startedAt: number
  updatedAt: number
}

export type EngineScore = { cp: number | null; mate: number | null }
