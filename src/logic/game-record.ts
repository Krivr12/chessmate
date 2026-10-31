import type { Color } from 'chess.js'
import type { OpponentId } from './opponents'
import type { Difficulty, Grade, MoveRecord, Outcome } from './types'

/** One move as saved in history. Evaluations are optional because older games may lack them. */
export type Ply = {
  uci: string
  san: string
  by: 'player' | 'opponent'
  cp?: number
  mate?: number
  winAfter?: number
  grade?: Grade
  bestBefore?: string
}

export type GameReason =
  | 'checkmate'
  | 'resign'
  | 'stalemate'
  | 'insufficient'
  | 'threefold'
  | 'fifty'
  | 'draw'

export type GameRecord = {
  id: string
  startedAt: number
  endedAt: number
  result: 'win' | 'loss' | 'draw'
  reason: GameReason
  playerColor: Color
  difficulty: Difficulty
  opponent: OpponentId
  startFen: string
  moves: Ply[]
  /** Average move score from 0 to 100 (see GRADE_POINTS). 0 when no move was graded. */
  accuracy: number
  gradeCounts: Record<Grade, number>
  /** False when any move is missing its evaluation. Such games are analyzed later on review. */
  analyzed: boolean
}

/** Points per grade for the accuracy score. Best moves score 100, blunders 0. */
export const GRADE_POINTS: Record<Grade, number> = {
  best: 100,
  great: 90,
  good: 75,
  inaccuracy: 50,
  mistake: 20,
  blunder: 0,
}

const GRADES = Object.keys(GRADE_POINTS) as Grade[]

export function emptyGradeCounts(): Record<Grade, number> {
  return { best: 0, great: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
}

/** Maps the engine-independent outcome text to a stored reason. */
export function reasonFor(outcomeReason: string): GameReason {
  switch (outcomeReason) {
    case 'Checkmate':
      return 'checkmate'
    case 'Resignation':
      return 'resign'
    case 'Stalemate':
      return 'stalemate'
    case 'Insufficient material':
      return 'insufficient'
    case 'Threefold repetition':
      return 'threefold'
    case '50-move rule':
      return 'fifty'
    default:
      return 'draw'
  }
}

export function toPly(m: MoveRecord): Ply {
  return {
    uci: m.from + m.to + (m.promotion ?? ''),
    san: m.san,
    by: m.by,
    cp: m.cp,
    mate: m.mate,
    winAfter: m.winAfter,
    grade: m.grade,
    bestBefore: m.bestBefore,
  }
}

export function gradeCountsOf(moves: MoveRecord[]): Record<Grade, number> {
  const counts = emptyGradeCounts()
  for (const m of moves) if (m.by === 'player' && m.grade) counts[m.grade] += 1
  return counts
}

/** Average of GRADE_POINTS over the player's graded moves, rounded to a whole number. */
export function accuracyOf(moves: MoveRecord[]): number {
  const graded = moves.filter((m) => m.by === 'player' && m.grade && GRADES.includes(m.grade))
  if (graded.length === 0) return 0
  const total = graded.reduce((sum, m) => sum + GRADE_POINTS[m.grade as Grade], 0)
  return Math.round(total / graded.length)
}

/** True when every move has a win % after it, and each player move also has one before it. */
export function isAnalyzed(moves: MoveRecord[]): boolean {
  return moves.every(
    (m) => m.winAfter !== undefined && (m.by === 'opponent' || (m.winBefore !== undefined && m.grade !== undefined)),
  )
}

export type BattleSnapshot = {
  startedAt: number
  startFen: string
  playerColor: Color
  difficulty: Difficulty
  opponent: OpponentId
  moves: MoveRecord[]
  outcome: Outcome
  endedAt: number
}

/** Builds the saved record for a finished battle. The id comes from the start time, so saving twice overwrites one record. */
export function buildGameRecord(b: BattleSnapshot): GameRecord {
  return {
    id: `game-${b.startedAt}`,
    startedAt: b.startedAt,
    endedAt: b.endedAt,
    result: b.outcome.result,
    reason: reasonFor(b.outcome.reason),
    playerColor: b.playerColor,
    difficulty: b.difficulty,
    opponent: b.opponent,
    startFen: b.startFen,
    moves: b.moves.map(toPly),
    accuracy: accuracyOf(b.moves),
    gradeCounts: gradeCountsOf(b.moves),
    analyzed: isAnalyzed(b.moves),
  }
}

const RESULTS = ['win', 'loss', 'draw']
const REASONS: GameReason[] = ['checkmate', 'resign', 'stalemate', 'insufficient', 'threefold', 'fifty', 'draw']

/** Shape check for a stored or imported game. Unknown fields are ignored. */
export function isGameRecord(v: unknown): v is GameRecord {
  if (!v || typeof v !== 'object') return false
  const g = v as Partial<GameRecord>
  return (
    typeof g.id === 'string' &&
    typeof g.startedAt === 'number' &&
    typeof g.endedAt === 'number' &&
    RESULTS.includes(g.result as string) &&
    REASONS.includes(g.reason as GameReason) &&
    (g.playerColor === 'w' || g.playerColor === 'b') &&
    typeof g.startFen === 'string' &&
    Array.isArray(g.moves) &&
    typeof g.accuracy === 'number' &&
    typeof g.analyzed === 'boolean'
  )
}
