import type { Difficulty } from './types'
import type { GameRecord } from './game-record'

export type ResultCounts = { wins: number; losses: number; draws: number }

export type HistorySummary = ResultCounts & {
  total: number
  byDifficulty: Record<Difficulty, ResultCounts>
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

/** Counts of wins, losses, and draws, overall and per difficulty. */
export function summarizeHistory(games: GameRecord[]): HistorySummary {
  const byDifficulty = Object.fromEntries(
    DIFFICULTIES.map((d) => [d, { wins: 0, losses: 0, draws: 0 }]),
  ) as Record<Difficulty, ResultCounts>
  const summary: HistorySummary = { total: 0, wins: 0, losses: 0, draws: 0, byDifficulty }
  for (const g of games) {
    summary.total += 1
    const bucket = byDifficulty[g.difficulty]
    if (g.result === 'win') {
      summary.wins += 1
      if (bucket) bucket.wins += 1
    } else if (g.result === 'loss') {
      summary.losses += 1
      if (bucket) bucket.losses += 1
    } else {
      summary.draws += 1
      if (bucket) bucket.draws += 1
    }
  }
  return summary
}

/** Newest first, limited to `n` games. Does not change the input array. */
export function latestGames(games: GameRecord[], n: number): GameRecord[] {
  return [...games].sort((a, b) => b.endedAt - a.endedAt).slice(0, Math.max(0, n))
}
