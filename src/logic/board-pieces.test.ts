import { Chess, type Square } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { applyMove, initialPieces, piecesFromMoves, type PieceState } from './board-pieces'

/** Piece list must always agree with chess.js and keep IDs unique. */
function expectInSync(pieces: PieceState[], game: Chess) {
  const onBoard = pieces.filter((p) => p.square)
  const cells = game.board().flat().filter(Boolean)
  expect(onBoard).toHaveLength(cells.length)
  for (const cell of cells) {
    const p = onBoard.find((x) => x.square === cell!.square)
    expect(p?.type).toBe(cell!.type)
    expect(p?.color).toBe(cell!.color)
  }
  expect(new Set(pieces.map((p) => p.id)).size).toBe(pieces.length)
}

function replay(pgnMoves: string[], fen?: string) {
  const game = new Chess(fen)
  let pieces = initialPieces(game.fen())
  const snapshots: PieceState[][] = []
  for (const san of pgnMoves) {
    pieces = applyMove(pieces, game.move(san))
    expectInSync(pieces, game)
    snapshots.push(pieces)
  }
  return { game, pieces, snapshots }
}

const idAt = (pieces: PieceState[], sq: Square) => pieces.find((p) => p.square === sq)?.id

describe('board pieces', () => {
  it('tracks kingside and queenside castling', () => {
    const { pieces } = replay([
      'e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Be6', 'O-O', 'Qd7', 'd3', 'Nc6', 'Nc3', 'O-O-O',
    ])
    const initial = initialPieces(new Chess().fen())
    expect(idAt(pieces, 'g1')).toBe(idAt(initial, 'e1'))
    expect(idAt(pieces, 'f1')).toBe(idAt(initial, 'h1'))
    expect(idAt(pieces, 'c8')).toBe(idAt(initial, 'e8'))
    expect(idAt(pieces, 'd8')).toBe(idAt(initial, 'a8'))
  })

  it('removes the right pawn on en passant', () => {
    const { pieces } = replay(['e4', 'a6', 'e5', 'd5', 'exd6'])
    const initial = initialPieces(new Chess().fen())
    const capturedId = idAt(initial, 'd7')
    expect(pieces.find((p) => p.id === capturedId)?.square).toBeNull()
    expect(idAt(pieces, 'd6')).toBe(idAt(initial, 'e2'))
  })

  it('changes type on promotion and keeps the identity', () => {
    const fen = '1n2k3/P7/8/8/8/8/8/4K3 w - - 0 1'
    const { pieces } = replay(['axb8=Q'], fen)
    const initial = initialPieces(fen)
    const pawnId = idAt(initial, 'a7')
    expect(pieces.find((p) => p.id === pawnId)).toMatchObject({ type: 'q', square: 'b8' })
    expect(pieces.find((p) => p.id === idAt(initial, 'b8'))?.square).toBeNull()
  })

  it('rebuilds identical IDs from a move list', () => {
    const { game, pieces } = replay(['e4', 'd5', 'exd5', 'Qxd5', 'Nc3'])
    const moves = game.history({ verbose: true }).map((m) => ({ from: m.from, to: m.to }))
    expect(piecesFromMoves(new Chess().fen(), moves)).toEqual(pieces)
  })
})
