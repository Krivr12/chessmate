import { Chess, type Color, type Move, type Square } from 'chess.js'
import { applyMove, type PieceState } from './board-pieces'

/** Selected square and the squares it can move to. */
export type Selection = { selected: Square | null; legalTargets: Square[] }

export const NO_SELECTION: Selection = { selected: null, legalTargets: [] }

/** Legal destinations of the piece on `square` (empty when there is no legal move from it). */
export function legalTargetsFrom(fen: string, square: Square): Square[] {
  const moves = new Chess(fen).moves({ square, verbose: true })
  return [...new Set(moves.map((m) => m.to))]
}

/**
 * What a tap means. A tap on a legal target moves the selected piece. A tap on one of
 * `color`'s pieces selects it. Any other tap clears the selection.
 */
export type TapResult =
  | { type: 'move'; from: Square; to: Square }
  | { type: 'select'; selection: Selection }

export function tapSquare(fen: string, current: Selection, square: Square, color: Color): TapResult {
  if (current.selected && current.legalTargets.includes(square)) {
    return { type: 'move', from: current.selected, to: square }
  }
  const piece = new Chess(fen).get(square)
  if (piece && piece.color === color && square !== current.selected) {
    return { type: 'select', selection: { selected: square, legalTargets: legalTargetsFrom(fen, square) } }
  }
  return { type: 'select', selection: NO_SELECTION }
}

/** Square of the side-to-move's king when that king is in check, otherwise null. */
export function checkSquareOf(fen: string): Square | null {
  const game = new Chess(fen)
  if (!game.inCheck()) return null
  for (const row of game.board()) {
    for (const cell of row) if (cell?.type === 'k' && cell.color === game.turn()) return cell.square
  }
  return null
}

export type MoveAttempt =
  | { kind: 'illegal' }
  /** A pawn reaches the last rank and no piece was chosen yet. */
  | { kind: 'promotion' }
  | { kind: 'moved'; move: Move; fen: string; pieces: PieceState[] }

/** Plays a move on a position and keeps the piece identities for animation. Does not mutate input. */
export function attemptMove(
  fen: string,
  pieces: PieceState[],
  from: Square,
  to: Square,
  promotion?: 'q' | 'r' | 'b' | 'n',
): MoveAttempt {
  const game = new Chess(fen)
  const legal = game.moves({ square: from, verbose: true }).find((m) => m.to === to)
  if (!legal) return { kind: 'illegal' }
  if (legal.promotion && !promotion) return { kind: 'promotion' }
  const move = game.move({ from, to, promotion: legal.promotion ? promotion : undefined })
  return { kind: 'moved', move, fen: game.fen(), pieces: applyMove(pieces, move) }
}
