import { Chess, type Color, type Square } from 'chess.js'
import { initialPieces, type PieceState } from './board-pieces'
import { attemptMove } from './board-input'
import type { PuzzleRow } from './puzzle-validate'

/**
 * Puzzle play rules. Pure: no React, no storage, no engine.
 *
 * `moves[0]` is the opponent's move from `fen`. The player moves at odd indexes and the
 * opponent replies at even indexes after the first one. The player wins by playing the
 * solution. Any wrong move ends the attempt (D5). A mate-in-one accepts any checkmating move.
 */

export type Puzzle = {
  id: string
  fen: string
  moves: string[]
  rating: number
  themes: string[]
}

export const puzzleFromRow = ([id, fen, moves, rating, themes]: PuzzleRow): Puzzle => ({
  id,
  fen,
  moves,
  rating,
  themes,
})

export type PuzzleStatus = 'opponent' | 'playing' | 'solved' | 'failed'

export type PuzzleState = {
  /** opponent: the opponent's move is due. playing: waiting for the player. */
  status: PuzzleStatus
  /** Index in `moves` of the next expected move. */
  index: number
  fen: string
  pieces: PieceState[]
  lastMove: { from: Square; to: Square } | null
  playerColor: Color
  /** 0: no hint, 1: piece highlighted, 2: destination shown. */
  hintLevel: 0 | 1 | 2
  usedHint: boolean
  /** SAN of the wrong move that ended the attempt. */
  wrongSan: string | null
  /** SAN of every move so far, both sides. */
  played: string[]
}

/** Number of player moves still to play from `index` (player moves are at odd indexes). */
export function remainingPlayerMoves(length: number, index: number): number {
  let n = 0
  for (let i = index; i < length; i++) if (i % 2 === 1) n++
  return n
}

/** The player is the side that does not move first in the puzzle FEN. */
export function playerColorOf(fen: string): Color {
  return new Chess(fen).turn() === 'w' ? 'b' : 'w'
}

/** Starts an attempt. The position is the one before the opponent's first move. */
export function startPuzzle(p: Puzzle): PuzzleState {
  return {
    status: 'opponent',
    index: 0,
    fen: p.fen,
    pieces: initialPieces(p.fen),
    lastMove: null,
    playerColor: playerColorOf(p.fen),
    hintLevel: 0,
    usedHint: false,
    wrongSan: null,
    played: [],
  }
}

/** Plays the opponent's move that is due. Does nothing when the player is up. */
export function playOpponentMove(p: Puzzle, s: PuzzleState): PuzzleState {
  if (s.status !== 'opponent') return s
  const uci = p.moves[s.index]
  const promotion = uci[4] as 'q' | 'r' | 'b' | 'n' | undefined
  const r = attemptMove(s.fen, s.pieces, uci.slice(0, 2) as Square, uci.slice(2, 4) as Square, promotion)
  // Validated puzzles never reach this branch. Stop instead of guessing.
  if (r.kind !== 'moved') return { ...s, status: 'failed' }
  const index = s.index + 1
  return {
    ...s,
    status: index >= p.moves.length ? 'solved' : 'playing',
    index,
    fen: r.fen,
    pieces: r.pieces,
    lastMove: { from: r.move.from, to: r.move.to },
    played: [...s.played, r.move.san],
  }
}

export type AttemptResult =
  | { kind: 'illegal' }
  | { kind: 'promotion' }
  | { kind: 'correct'; state: PuzzleState }
  | { kind: 'wrong'; state: PuzzleState }

/** The player tries a move. Returns whether it is correct, wrong, or needs a promotion choice. */
export function attemptPuzzleMove(
  p: Puzzle,
  s: PuzzleState,
  from: Square,
  to: Square,
  promotion?: 'q' | 'r' | 'b' | 'n',
): AttemptResult {
  if (s.status !== 'playing') return { kind: 'illegal' }
  const r = attemptMove(s.fen, s.pieces, from, to, promotion)
  if (r.kind !== 'moved') return r
  const uci = from + to + (r.move.promotion ?? '')
  const expected = p.moves[s.index]
  const isMate = r.move.san.endsWith('#')
  // Mate in one: any move that checkmates wins (plan M29).
  const mateRule = remainingPlayerMoves(p.moves.length, s.index) === 1 && isMate
  const played = [...s.played, r.move.san]
  const lastMove = { from, to }

  if (uci !== expected && !mateRule) {
    return {
      kind: 'wrong',
      state: { ...s, status: 'failed', fen: r.fen, pieces: r.pieces, lastMove, wrongSan: r.move.san, played },
    }
  }
  const index = s.index + 1
  return {
    kind: 'correct',
    state: {
      ...s,
      status: index >= p.moves.length ? 'solved' : 'opponent',
      index,
      fen: r.fen,
      pieces: r.pieces,
      lastMove,
      played,
    },
  }
}

/** Next hint step. Level 1 marks the piece to move, level 2 also shows the destination. */
export function requestHint(s: PuzzleState): PuzzleState {
  if (s.status !== 'playing' || s.hintLevel === 2) return s
  return { ...s, hintLevel: (s.hintLevel + 1) as 1 | 2, usedHint: true }
}

/** Squares to mark on the board for the current hint level, or null when no hint is shown. */
export function hintSquares(p: Puzzle, s: PuzzleState): { from: Square; to: Square } | null {
  if (s.hintLevel === 0 || s.status !== 'playing') return null
  const uci = p.moves[s.index]
  const from = uci.slice(0, 2) as Square
  return { from, to: s.hintLevel === 2 ? (uci.slice(2, 4) as Square) : from }
}

/** Position the player sees first: the puzzle FEN after the opponent's opening move. */
export function displayFen(p: Puzzle): string {
  const uci = p.moves[0]
  const game = new Chess(p.fen)
  game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
  return game.fen()
}

export type SolutionStep = { san: string; from: Square; to: Square; by: 'player' | 'opponent'; fen: string }

/** Every move of the puzzle, with the position after each one. Used by View solution. */
export function solutionSteps(p: Puzzle): SolutionStep[] {
  const game = new Chess(p.fen)
  return p.moves.map((uci, i) => {
    const m = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    return { san: m.san, from: m.from, to: m.to, by: i % 2 === 0 ? 'opponent' : 'player', fen: game.fen() }
  })
}

/** Result of one attempt, as saved to the `puzzles` store. */
export type AttemptSummary = { solved: boolean; mistakes: number; usedHint: boolean; timeMs: number }

export type PuzzleProgress = {
  id: string
  status: 'solved' | 'failed'
  attempts: number
  firstTrySolved: boolean
  usedHint: boolean
  solvedAt?: number
  timeMs?: number
}

/**
 * Folds one finished attempt into the saved progress. A solved puzzle stays solved.
 * `firstTrySolved` is decided by the first attempt only (D5): it needs a clean solve on that try.
 */
export function mergeAttempt(
  id: string,
  existing: PuzzleProgress | undefined,
  a: AttemptSummary,
  now: number,
): PuzzleProgress {
  const wasSolved = existing?.status === 'solved'
  const solvedNow = a.solved && !wasSolved
  const solved = wasSolved || a.solved
  return {
    id,
    status: solved ? 'solved' : 'failed',
    attempts: (existing?.attempts ?? 0) + 1,
    firstTrySolved: existing ? existing.firstTrySolved : a.solved && a.mistakes === 0,
    usedHint: (existing?.usedHint ?? false) || a.usedHint,
    solvedAt: wasSolved ? existing?.solvedAt : a.solved ? now : undefined,
    timeMs: solvedNow ? a.timeMs : existing?.timeMs,
  }
}

/**
 * The next puzzle after `current`: the unsolved one with the lowest rating at or above the
 * current rating, otherwise the lowest unsolved one. Null when nothing is left.
 */
export function pickNextPuzzle<T extends { id: string; rating: number }>(
  pool: T[],
  solvedIds: ReadonlySet<string>,
  current: { id: string; rating: number },
): T | null {
  const open = pool
    .filter((p) => p.id !== current.id && !solvedIds.has(p.id))
    .sort((a, b) => a.rating - b.rating)
  return open.find((p) => p.rating >= current.rating) ?? open[0] ?? null
}
