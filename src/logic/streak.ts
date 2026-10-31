import { isDateKey } from './activity'

const DAY_MS = 24 * 60 * 60 * 1000

/** Date key (YYYY-MM-DD) to a UTC timestamp at midnight, so day arithmetic never depends on the timezone. */
const toUtc = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Date key `delta` days from `key`. Pure calendar arithmetic. */
export function shiftDay(key: string, delta: number): string {
  const d = new Date(toUtc(key) + delta * DAY_MS)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/**
 * Consecutive active days ending today. If today has no activity yet, the streak still counts
 * back from yesterday, so a streak is not lost before the player has played today.
 */
export function currentStreak(days: string[], today: string): number {
  const active = new Set(days.filter(isDateKey))
  let cursor = active.has(today) ? today : shiftDay(today, -1)
  let count = 0
  while (active.has(cursor)) {
    count += 1
    cursor = shiftDay(cursor, -1)
  }
  return count
}

/** Longest run of consecutive active days in the list. */
export function bestStreak(days: string[]): number {
  const sorted = [...new Set(days.filter(isDateKey))].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const day of sorted) {
    run = prev !== null && toUtc(day) - toUtc(prev) === DAY_MS ? run + 1 : 1
    best = Math.max(best, run)
    prev = day
  }
  return best
}
