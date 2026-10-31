import type { GameRecord } from './game-record'
import { latestGames, summarizeHistory, type HistorySummary } from './history'
import { bestStreak, currentStreak } from './streak'

export type ProfileStats = {
  record: HistorySummary
  /** Win percentage rounded to a whole number. 0 when there are no games. */
  winRate: number
  /** Most recent games, oldest first, so bars read left to right. */
  recentGames: GameRecord[]
  currentDayStreak: number
  bestDayStreak: number
  /** Longest run of consecutive wins, in the order games were played. */
  bestWinStreak: number
}

/** Longest run of wins, games sorted by end time. */
export function longestWinStreak(games: GameRecord[]): number {
  let best = 0
  let run = 0
  for (const g of [...games].sort((a, b) => a.endedAt - b.endedAt)) {
    run = g.result === 'win' ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

/** Everything the Profile and Home screens show, from stored data only. */
export function computeStats(games: GameRecord[], activityDays: string[], today: string): ProfileStats {
  const record = summarizeHistory(games)
  return {
    record,
    winRate: record.total === 0 ? 0 : Math.round((record.wins / record.total) * 100),
    recentGames: latestGames(games, 10).reverse(),
    currentDayStreak: currentStreak(activityDays, today),
    bestDayStreak: bestStreak(activityDays),
    bestWinStreak: longestWinStreak(games),
  }
}
