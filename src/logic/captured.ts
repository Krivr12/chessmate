import { Chess, type Color, type PieceSymbol } from 'chess.js'

/** Pieces that can be captured, in the order the panel shows them. */
export const CAPTURABLE = ['p', 'n', 'b', 'r', 'q'] as const
export type CapturableType = (typeof CAPTURABLE)[number]
export type CaptureCounts = Record<CapturableType, number>

/** Standard material values. The king is excluded because it cannot be captured. */
export const PIECE_VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

export type CapturedSummary = {
  /** Pieces the player captured. The panel draws them in the opponent's color. */
  byPlayer: CaptureCounts
  /** Pieces the opponent captured. The panel draws them in the player's color. */
  byOpponent: CaptureCounts
}

export const emptyCounts = (): CaptureCounts => ({ p: 0, n: 0, b: 0, r: 0, q: 0 })

/**
 * Count captures by replaying the move list from the start position.
 * Works for undo, redo and resume, because the input is always the current move list.
 * En passant and promotion captures are included, since chess.js reports them as captures.
 */
export function capturedFromMoves(
  startFen: string,
  moves: { from: string; to: string; promotion?: string }[],
  playerColor: Color,
): CapturedSummary {
  const summary: CapturedSummary = { byPlayer: emptyCounts(), byOpponent: emptyCounts() }
  const game = new Chess(startFen)
  for (const m of moves) {
    const move = game.move({ from: m.from, to: m.to, promotion: m.promotion })
    if (!move.captured) continue
    const target = move.color === playerColor ? summary.byPlayer : summary.byOpponent
    target[move.captured as CapturableType] += 1
  }
  return summary
}

/**
 * Material difference from the pieces still on the board, from the player's side.
 * Positive means the player is ahead. Because it reads the board, promotions count correctly.
 */
export function materialBalance(fen: string, playerColor: Color): number {
  let balance = 0
  for (const row of new Chess(fen).board()) {
    for (const cell of row) {
      if (!cell) continue
      const value = PIECE_VALUE[cell.type]
      balance += cell.color === playerColor ? value : -value
    }
  }
  return balance
}

const LABEL: Record<CapturableType, [string, string]> = {
  p: ['pawn', 'pawns'],
  n: ['knight', 'knights'],
  b: ['bishop', 'bishops'],
  r: ['rook', 'rooks'],
  q: ['queen', 'queens'],
}

/** Screen-reader sentence for one side, for example "You captured 2 pawns and 1 knight". */
export function captureSentence(name: string, counts: CaptureCounts, verb: 'captured' | 'captures'): string {
  const parts = CAPTURABLE.filter((t) => counts[t] > 0).map((t) => {
    const n = counts[t]
    return `${n} ${LABEL[t][n === 1 ? 0 : 1]}`
  })
  if (parts.length === 0) return `${name} ${verb} nothing yet`
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
  return `${name} ${verb} ${list}`
}
