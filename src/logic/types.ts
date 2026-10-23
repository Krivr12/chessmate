import type { Color, PieceSymbol, Square } from 'chess.js'
import type { Difficulty } from '@/constants'

export type { Difficulty }

export type Grade = 'best' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'

export type Mood = 'idle' | 'think' | 'happy' | 'sad' | 'shock'

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
  startedAt: number
  updatedAt: number
}

export type EngineScore = { cp: number | null; mate: number | null }
