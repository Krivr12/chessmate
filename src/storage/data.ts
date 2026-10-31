import { getDb } from './db'
import { META_KEYS } from './meta'
import { clearBattle } from './battle-storage'
import { ACTIVITY_KEY } from './activity'

/** Meta keys that belong to the player's history and progress. */
const HISTORY_META_KEYS = [ACTIVITY_KEY, 'badges']

/** Every meta key, including the first-launch flag and the profile name (D7). */
const ALL_META_KEYS = [...HISTORY_META_KEYS, META_KEYS.hasSeenWelcome, 'profile']

/** Games, activity days, and badges. Does not touch the current battle or settings. */
export async function clearGameHistory(): Promise<void> {
  const db = await getDb()
  await db.clear('games')
  await Promise.all(HISTORY_META_KEYS.map((k) => db.delete('meta', k)))
}

export async function clearPuzzleProgress(): Promise<void> {
  const db = await getDb()
  await db.clear('puzzles')
}

export async function clearLearningProgress(): Promise<void> {
  const db = await getDb()
  await db.clear('lessons')
}

/** Everything the app stores: history, progress, profile, first-launch flag, and the current battle. */
export async function clearAllStoredData(): Promise<void> {
  const db = await getDb()
  await db.clear('games')
  await db.clear('puzzles')
  await db.clear('lessons')
  await Promise.all(ALL_META_KEYS.map((k) => db.delete('meta', k)))
  await clearBattle()
}

/**
 * Removes cached app files, so the next open downloads them again.
 * Needs an internet connection on the next launch. The caller should warn first.
 */
export async function clearServiceWorkerCaches(): Promise<void> {
  if (typeof caches === 'undefined') return
  const names = await caches.keys()
  await Promise.all(names.map((n) => caches.delete(n)))
}

export type StorageUsage = { usageMB: number; quotaMB: number } | null

/** Approximate usage from the browser. Some browsers round or limit these numbers. */
export async function estimateStorage(): Promise<StorageUsage> {
  try {
    const est = await navigator.storage?.estimate?.()
    if (!est || est.usage === undefined || est.quota === undefined) return null
    const mb = (n: number) => Math.round((n / (1024 * 1024)) * 10) / 10
    return { usageMB: mb(est.usage), quotaMB: mb(est.quota) }
  } catch {
    return null
  }
}
