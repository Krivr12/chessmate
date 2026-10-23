import type { Color } from 'chess.js'
import type { EngineScore } from './types'

/** Lichess-style logistic curve. `cp` is from the point of view of whoever we care about. */
export function winPercent(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1)
}

/**
 * Convert an engine score (reported for the side to move) into the player's
 * win percentage. `mate 0` means the side to move is already mated.
 */
export function playerWinPercent(score: EngineScore, sideToMove: Color, playerColor: Color): number {
  const sign = sideToMove === playerColor ? 1 : -1
  if (score.mate !== null) {
    if (score.mate === 0) return sign === 1 ? 0 : 100
    return score.mate * sign > 0 ? 100 : 0
  }
  return winPercent((score.cp ?? 0) * sign)
}

export const roundWin = (win: number) => Math.round(Math.max(0, Math.min(100, win)))
