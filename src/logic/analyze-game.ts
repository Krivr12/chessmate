import { Chess } from 'chess.js'
import { accuracyOf, gradeCountsOf, type GameRecord, type Ply } from './game-record'
import { gradeMove } from './grade-move'
import { playerWinPercent } from './win-percent'

/** One engine score for a position, from the side to move's point of view. */
export type Evaluation = { cp: number | null; mate: number | null; best: string | null }
export type Evaluate = (fen: string) => Promise<Evaluation>

export class AnalysisCancelled extends Error {
  constructor() {
    super('Analysis was cancelled')
  }
}

/**
 * FEN after each ply. Index 0 is the start position, and index i is the position after ply i.
 * Positions are rebuilt from the moves, so nothing is stored per ply.
 */
export function positionsFor(startFen: string, plies: { uci: string }[]): string[] {
  const game = new Chess(startFen)
  const out = [game.fen()]
  for (const p of plies) {
    game.move({ from: p.uci.slice(0, 2), to: p.uci.slice(2, 4), promotion: p.uci[4] })
    out.push(game.fen())
  }
  return out
}

/** Finished positions are scored without the engine: mate for the mated side, a draw otherwise. */
function terminalScore(fen: string): Evaluation | null {
  const g = new Chess(fen)
  if (!g.isGameOver()) return null
  return g.isCheckmate() ? { cp: null, mate: 0, best: null } : { cp: 0, mate: null, best: null }
}

/**
 * Scores every position of an older game (one that was saved without evaluations), then
 * regrades the moves and recomputes accuracy. Each position is evaluated once.
 */
export async function analyzeRecord(
  record: GameRecord,
  evaluate: Evaluate,
  opts: { onProgress?: (done: number, total: number) => void; signal?: AbortSignal } = {},
): Promise<GameRecord> {
  const positions = positionsFor(record.startFen, record.moves)
  const unique = [...new Set(positions)]
  const scores = new Map<string, { cp: number | null; mate: number | null; best: string | null; win: number }>()

  let done = 0
  for (const fen of unique) {
    if (opts.signal?.aborted) throw new AnalysisCancelled()
    const ev = terminalScore(fen) ?? (await evaluate(fen))
    const sideToMove = fen.split(' ')[1] as 'w' | 'b'
    scores.set(fen, {
      ...ev,
      win: playerWinPercent({ cp: ev.cp, mate: ev.mate }, sideToMove, record.playerColor),
    })
    done += 1
    opts.onProgress?.(done, unique.length)
  }

  const plies: Ply[] = record.moves.map((p, i) => {
    const before = scores.get(positions[i])
    const after = scores.get(positions[i + 1])
    if (!before || !after) return p
    const winAfter = after.win
    if (p.by === 'opponent') {
      return { ...p, winAfter, cp: after.cp ?? undefined, mate: after.mate ?? undefined }
    }
    return {
      ...p,
      winBefore: before.win,
      winAfter,
      cp: after.cp ?? undefined,
      mate: after.mate ?? undefined,
      bestBefore: before.best ?? undefined,
      grade: gradeMove(before.win, winAfter, before.best === p.uci),
    }
  })

  return {
    ...record,
    moves: plies,
    accuracy: accuracyOf(plies),
    gradeCounts: gradeCountsOf(plies),
    analyzed: plies.every((p) => p.winAfter !== undefined && (p.by === 'opponent' || p.grade !== undefined)),
  }
}
