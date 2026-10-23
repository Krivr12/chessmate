import type { MoveRecord } from './types'

/**
 * Per-move accuracy from the win % drop (Lichess constants, approximate).
 * Lichess' full game accuracy also weights by volatility; this is a plain mean.
 */
export function moveAccuracy(winDiff: number): number {
  const diff = Math.max(0, winDiff)
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * diff) - 3.1669))
}

/** Average accuracy over graded player moves, or null when there are none. */
export function gameAccuracy(moves: MoveRecord[]): number | null {
  const scored = moves.filter(
    (m) => m.by === 'player' && m.winBefore !== undefined && m.winAfter !== undefined,
  )
  if (scored.length === 0) return null
  const total = scored.reduce((sum, m) => sum + moveAccuracy(m.winBefore! - m.winAfter!), 0)
  return total / scored.length
}
