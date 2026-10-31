import { Chess, type Move } from 'chess.js'
import type { GameRecord, Ply } from './game-record'
import { hintReason } from './hint-text'

export type CriticalMoment = {
  /** Index into the move list (0-based) of the player's move. */
  ply: number
  /** Win % the player lost with this move. */
  drop: number
  /** The engine's better move, in SAN, when known. */
  bestSan: string | null
  /** UCI of the engine's better move, for the board arrow. */
  bestUci: string | null
  /** Short reason the better move helps. */
  reason: string | null
}

/** SAN of a UCI move in a position, or null if the move is not legal there. */
export function sanFor(fen: string, uci: string): { san: string; move: Move } | null {
  try {
    const move = new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    return { san: move.san, move }
  } catch {
    return null
  }
}

/**
 * The player's biggest win % drops, largest first. Moves without both evaluations are skipped.
 * Only drops of at least `minDrop` points count, so a flat game gives no critical moments.
 */
export function criticalMoments(record: GameRecord, positions: string[], count = 3, minDrop = 5): CriticalMoment[] {
  const candidates: CriticalMoment[] = []
  record.moves.forEach((p: Ply, i) => {
    if (p.by !== 'player' || p.winBefore === undefined || p.winAfter === undefined) return
    const drop = p.winBefore - p.winAfter
    if (drop < minDrop) return
    const best = p.bestBefore ? sanFor(positions[i], p.bestBefore) : null
    candidates.push({
      ply: i,
      drop: Math.round(drop),
      bestSan: best?.san ?? null,
      bestUci: p.bestBefore ?? null,
      reason: best ? hintReason(best.move) : null,
    })
  })
  return candidates.sort((a, b) => b.drop - a.drop).slice(0, count)
}

/** Label for a move in the list, for example "e4 (Best)". Grade text is always shown, never only color. */
export function plyLabel(p: Ply): string {
  const grade = p.grade ? p.grade.charAt(0).toUpperCase() + p.grade.slice(1) : ''
  return grade ? `${p.san}, ${grade}` : p.san
}
