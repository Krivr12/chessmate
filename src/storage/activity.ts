import { isDateKey } from '@/logic/activity'
import { getMeta, setMeta } from './meta'

export const ACTIVITY_KEY = 'activityDays'

/** Days (YYYY-MM-DD) with at least one finished game, puzzle, or lesson. Sorted, no duplicates. */
export async function getActivityDays(): Promise<string[]> {
  const days = await getMeta<unknown[]>(ACTIVITY_KEY)
  return Array.isArray(days) ? days.filter(isDateKey).sort() : []
}

export async function recordActivity(day: string): Promise<void> {
  const days = await getActivityDays()
  if (days.includes(day)) return
  await setMeta(ACTIVITY_KEY, [...days, day].sort())
}
