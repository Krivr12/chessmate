import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js'

/** A piece with a stable identity so the board can animate it across moves. */
export type PieceState = {
  id: string
  type: PieceSymbol
  color: Color
  square: Square | null
}

export function initialPieces(fen: string): PieceState[] {
  const counts: Record<string, number> = {}
  const pieces: PieceState[] = []
  for (const row of new Chess(fen).board()) {
    for (const cell of row) {
      if (!cell) continue
      const key = cell.color + cell.type
      counts[key] = (counts[key] ?? 0) + 1
      pieces.push({ id: `${key}${counts[key]}`, type: cell.type, color: cell.color, square: cell.square })
    }
  }
  return pieces
}

const CASTLE_ROOK: Record<string, [Square, Square]> = {
  wk: ['h1', 'f1'],
  wq: ['a1', 'd1'],
  bk: ['h8', 'f8'],
  bq: ['a8', 'd8'],
}

/** Apply a chess.js move result to the piece list (returns a new list). */
export function applyMove(pieces: PieceState[], move: Move): PieceState[] {
  const next = pieces.map((p) => ({ ...p }))
  const at = (sq: Square) => next.find((p) => p.square === sq)

  if (move.flags.includes('e')) {
    const captured = at((move.to[0] + move.from[1]) as Square)
    if (captured) captured.square = null
  } else if (move.captured) {
    const captured = at(move.to)
    if (captured) captured.square = null
  }

  const mover = at(move.from)
  if (mover) {
    mover.square = move.to
    if (move.promotion) mover.type = move.promotion
  }

  for (const side of ['k', 'q'] as const) {
    if (move.flags.includes(side)) {
      const [rookFrom, rookTo] = CASTLE_ROOK[move.color + side]
      const rook = at(rookFrom)
      if (rook) rook.square = rookTo
    }
  }
  return next
}

/** Rebuild piece identities by replaying a move list (used for undo, redo and resume). */
export function piecesFromMoves(
  startFen: string,
  moves: { from: Square; to: Square; promotion?: PieceSymbol }[],
): PieceState[] {
  const game = new Chess(startFen)
  let pieces = initialPieces(startFen)
  for (const m of moves) pieces = applyMove(pieces, game.move(m))
  return pieces
}

/** Get all piece snapshots by replaying moves. Returns array of piece states for each position in the move list. */
export function pieceSnapshotsFromMoves(
  startFen: string,
  moves: { from: Square; to: Square; promotion?: PieceSymbol }[],
): PieceState[][] {
  const game = new Chess(startFen)
  let pieces = initialPieces(startFen)
  const snapshots = [pieces.map((p) => ({ ...p }))]
  for (const m of moves) {
    pieces = applyMove(pieces, game.move(m))
    snapshots.push(pieces.map((p) => ({ ...p })))
  }
  return snapshots
}

export const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}
