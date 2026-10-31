import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import easy from '@/data/puzzles/easy.json'
import medium from '@/data/puzzles/medium.json'
import hard from '@/data/puzzles/hard.json'
import { validatePuzzleRow, type PuzzleRow } from './puzzle-validate'
import {
  attemptPuzzleMove,
  displayFen,
  hintSquares,
  mergeAttempt,
  pickNextPuzzle,
  playOpponentMove,
  playerColorOf,
  puzzleFromRow,
  remainingPlayerMoves,
  requestHint,
  solutionSteps,
  startPuzzle,
  type Puzzle,
  type PuzzleState,
} from './puzzle-flow'

const rowsOf = (bucket: { rows: unknown }) => bucket.rows as PuzzleRow[]

// Black king on g8 with pawns on f7 g7 h7; white rooks on a1 and b1; white king on g1.
// Opponent plays Kh8, then white mates with Ra8# or Rb8#.
const MATE_IN_ONE_FEN = '6k1/5ppp/8/8/8/8/8/RR4K1 b - - 0 1'
const mateInOne: Puzzle = { id: 'mate1', fen: MATE_IN_ONE_FEN, moves: ['g8h8', 'a1a8'], rating: 900, themes: ['mateIn1'] }

/** Plays the whole puzzle with the player's moves, letting the opponent reply automatically. */
function playThrough(p: Puzzle): PuzzleState {
  let s = startPuzzle(p)
  while (s.status !== 'solved' && s.status !== 'failed') {
    if (s.status === 'opponent') {
      s = playOpponentMove(p, s)
      continue
    }
    const uci = p.moves[s.index]
    const r = attemptPuzzleMove(p, s, uci.slice(0, 2) as never, uci.slice(2, 4) as never, uci[4] as never)
    if (r.kind !== 'correct') throw new Error(`expected ${uci} to be correct, got ${r.kind}`)
    s = r.state
  }
  return s
}

describe('puzzle flow', () => {
  it('counts the player moves that remain', () => {
    expect(remainingPlayerMoves(2, 1)).toBe(1)
    expect(remainingPlayerMoves(4, 1)).toBe(2)
    expect(remainingPlayerMoves(4, 3)).toBe(1)
  })

  it('makes the player the side that does not move first in the FEN', () => {
    expect(playerColorOf(MATE_IN_ONE_FEN)).toBe('w')
    expect(startPuzzle(mateInOne).playerColor).toBe('w')
  })

  it('plays the opponent opening move, then waits for the player', () => {
    const s = playOpponentMove(mateInOne, startPuzzle(mateInOne))
    expect(s.status).toBe('playing')
    expect(s.index).toBe(1)
    expect(s.played).toEqual(['Kh8'])
  })

  it('solves mate in one with the expected move', () => {
    const s = playThrough(mateInOne)
    expect(s.status).toBe('solved')
    expect(s.played.at(-1)).toMatch(/^R.*a8#$/)
  })

  it('accepts any checkmating move in a mate in one', () => {
    const started = playOpponentMove(mateInOne, startPuzzle(mateInOne))
    const alt = attemptPuzzleMove(mateInOne, started, 'b1' as never, 'b8' as never)
    expect(alt.kind).toBe('correct')
    if (alt.kind === 'correct') expect(alt.state.status).toBe('solved')
  })

  it('ends the attempt on the first wrong move', () => {
    const started = playOpponentMove(mateInOne, startPuzzle(mateInOne))
    const wrong = attemptPuzzleMove(mateInOne, started, 'a1' as never, 'a2' as never)
    expect(wrong.kind).toBe('wrong')
    if (wrong.kind === 'wrong') {
      expect(wrong.state.status).toBe('failed')
      expect(wrong.state.wrongSan).toBe('Ra2')
    }
  })

  it('asks for a promotion choice before committing a promoting move', () => {
    const promo: Puzzle = {
      id: 'promo',
      fen: '8/P6k/8/8/8/8/8/K7 w - - 0 1',
      moves: [],
      rating: 1000,
      themes: [],
    }
    const s: PuzzleState = { ...startPuzzle(promo), status: 'playing' }
    expect(attemptPuzzleMove(promo, s, 'a7' as never, 'a8' as never).kind).toBe('promotion')
  })

  it('reveals a hint in two steps and marks the attempt as hinted', () => {
    const started = playOpponentMove(mateInOne, startPuzzle(mateInOne))
    const once = requestHint(started)
    expect(once.hintLevel).toBe(1)
    expect(once.usedHint).toBe(true)
    expect(hintSquares(mateInOne, once)).toEqual({ from: 'a1', to: 'a1' })
    const twice = requestHint(once)
    expect(hintSquares(mateInOne, twice)).toEqual({ from: 'a1', to: 'a8' })
    expect(requestHint(twice)).toBe(twice)
  })

  it('lists the full solution with the position after each move', () => {
    const steps = solutionSteps(mateInOne)
    expect(steps.map((s) => s.san)).toEqual(['Kh8', 'Ra8#'])
    expect(steps[0].by).toBe('opponent')
    expect(steps[1].by).toBe('player')
    expect(new Chess(steps[1].fen).isCheckmate()).toBe(true)
  })

  it('shows the position after the opponent opening move', () => {
    const after = new Chess(MATE_IN_ONE_FEN)
    after.move({ from: 'g8', to: 'h8' })
    expect(displayFen(mateInOne)).toBe(after.fen())
  })
})

describe('puzzle progress', () => {
  const now = 1_000

  it('marks a clean first-try solve', () => {
    const p = mergeAttempt('a', undefined, { solved: true, mistakes: 0, usedHint: false, timeMs: 5 }, now)
    expect(p).toMatchObject({ status: 'solved', attempts: 1, firstTrySolved: true, solvedAt: now, timeMs: 5 })
  })

  it('does not count a solve after a failed first try as first-try', () => {
    const failed = mergeAttempt('a', undefined, { solved: false, mistakes: 1, usedHint: false, timeMs: 5 }, now)
    const solved = mergeAttempt('a', failed, { solved: true, mistakes: 0, usedHint: false, timeMs: 9 }, now + 1)
    expect(solved).toMatchObject({ status: 'solved', attempts: 2, firstTrySolved: false, timeMs: 9 })
  })

  it('keeps a puzzle solved after a later failed attempt', () => {
    const solved = mergeAttempt('a', undefined, { solved: true, mistakes: 0, usedHint: true, timeMs: 5 }, now)
    const again = mergeAttempt('a', solved, { solved: false, mistakes: 1, usedHint: false, timeMs: 3 }, now + 9)
    expect(again).toMatchObject({ status: 'solved', attempts: 2, usedHint: true, solvedAt: now })
  })

  it('picks the next unsolved puzzle at or above the current rating', () => {
    const pool = [
      { id: 'a', rating: 1000 },
      { id: 'b', rating: 1200 },
      { id: 'c', rating: 1100 },
      { id: 'd', rating: 1500 },
    ]
    expect(pickNextPuzzle(pool, new Set(['c']), pool[0])?.id).toBe('b')
    expect(pickNextPuzzle(pool, new Set(['b', 'c', 'd']), pool[0])).toBeNull()
  })
})

describe('bundled puzzles', () => {
  const all = [...rowsOf(easy), ...rowsOf(medium), ...rowsOf(hard)]

  it('ships 600 puzzles in each bucket', () => {
    expect(rowsOf(easy)).toHaveLength(600)
    expect(rowsOf(medium)).toHaveLength(600)
    expect(rowsOf(hard)).toHaveLength(600)
  })

  it('passes validation for every puzzle', () => {
    const problems = all.map((r) => [r[0], validatePuzzleRow(r)] as const).filter(([, p]) => p !== null)
    expect(problems).toEqual([])
  })

  it('solves every puzzle with its scripted moves', () => {
    for (const row of all) {
      const p = puzzleFromRow(row)
      expect(playThrough(p).status, p.id).toBe('solved')
    }
  }, 60_000)
})

describe('puzzle validator', () => {
  it('rejects an illegal move', () => {
    // After Kh8 it is White's move, so g1g3 (a two-square king step) is illegal.
    const row: PuzzleRow = ['x', MATE_IN_ONE_FEN, ['g8h8', 'g1g3'], 1000, ['mateIn1']]
    expect(validatePuzzleRow(row)).toMatch(/illegal move/)
  })

  it('rejects an invalid FEN', () => {
    expect(validatePuzzleRow(['x', 'not a fen', ['e2e4', 'e7e5'], 1000, []])).toBe('invalid FEN')
  })

  it('rejects a mate-in-one that is not checkmate', () => {
    const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    expect(validatePuzzleRow(['x', start, ['e2e4', 'e7e5'], 1000, ['mateIn1']])).toMatch(/checkmate/)
  })
})
