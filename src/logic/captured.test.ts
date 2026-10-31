import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { captureSentence, capturedFromMoves, emptyCounts, materialBalance } from './captured'

const START = new Chess().fen()
const uci = (moves: string[]) => moves.map((m) => ({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] }))

describe('capturedFromMoves', () => {
  it('counts a plain capture by each side', () => {
    // 1. e4 d5 2. exd5 Qxd5: the player (white) takes a pawn, then Black takes it back.
    const s = capturedFromMoves(START, uci(['e2e4', 'd7d5', 'e4d5', 'd8d5']), 'w')
    expect(s.byPlayer.p).toBe(1)
    expect(s.byOpponent.p).toBe(1)
  })

  it('counts en passant captures', () => {
    // 1. e4 a6 2. e5 d5 3. exd6 e.p.
    const s = capturedFromMoves(START, uci(['e2e4', 'a7a6', 'e4e5', 'd7d5', 'e5d6']), 'w')
    expect(s.byPlayer.p).toBe(1)
    expect(s.byPlayer.n + s.byPlayer.b + s.byPlayer.r + s.byPlayer.q).toBe(0)
  })

  it('counts a capture that also promotes', () => {
    // White pawn on b7 takes the black rook on a8 and promotes to a queen.
    const fen = 'r3k3/1P6/8/8/8/8/8/4K3 w - - 0 1'
    const s = capturedFromMoves(fen, uci(['b7a8q']), 'w')
    expect(s.byPlayer.r).toBe(1)
    expect(s.byPlayer.p).toBe(0)
  })

  it('counts for Black when the player is Black', () => {
    const fen = '4k3/8/8/8/3p4/4P3/8/4K3 b - - 0 1'
    const s = capturedFromMoves(fen, uci(['d4e3']), 'b')
    expect(s.byPlayer.p).toBe(1)
    expect(s.byOpponent.p).toBe(0)
  })

  it('follows undo and redo, because it only reads the current move list', () => {
    const moves = uci(['e2e4', 'd7d5', 'e4d5', 'd8d5'])
    expect(capturedFromMoves(START, moves.slice(0, 3), 'w').byOpponent.p).toBe(0)
    expect(capturedFromMoves(START, moves, 'w').byOpponent.p).toBe(1)
    expect(capturedFromMoves(START, [], 'w').byPlayer).toEqual(emptyCounts())
  })
})

describe('materialBalance', () => {
  it('is zero at the start', () => {
    expect(materialBalance(START, 'w')).toBe(0)
  })

  it('counts pieces on the board, so a promotion adds the new piece value', () => {
    // White pawn on b7 against a bare black king: a pawn up.
    expect(materialBalance('4k3/1P6/8/8/8/8/8/4K3 w - - 0 1', 'w')).toBe(1)
    // After b8=Q the pawn is a queen: nine up.
    const after = new Chess('4k3/1P6/8/8/8/8/8/4K3 w - - 0 1')
    after.move({ from: 'b7', to: 'b8', promotion: 'q' })
    expect(materialBalance(after.fen(), 'w')).toBe(9)
  })

  it('is seen from the player side', () => {
    expect(materialBalance('4k3/1P6/8/8/8/8/8/4K3 w - - 0 1', 'b')).toBe(-1)
  })
})

describe('captureSentence', () => {
  it('describes the captures in words', () => {
    const counts = { ...emptyCounts(), p: 2, n: 1 }
    expect(captureSentence('You', counts, 'captured')).toBe('You captured 2 pawns and 1 knight')
  })

  it('handles a single capture and an empty side', () => {
    expect(captureSentence('You', { ...emptyCounts(), q: 1 }, 'captured')).toBe('You captured 1 queen')
    expect(captureSentence('Frog', emptyCounts(), 'captured')).toBe('Frog captured nothing yet')
  })
})
