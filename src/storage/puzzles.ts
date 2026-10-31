import { mergeAttempt, type AttemptSummary, type PuzzleProgress } from '@/logic/puzzle-flow'
import { dateKey } from '@/logic/activity'
import { recordActivity } from './activity'
import { getDb } from './db'

const isProgress = (v: unknown): v is PuzzleProgress => {
  if (!v || typeof v !== 'object') return false
  const p = v as Partial<PuzzleProgress>
  return (
    typeof p.id === 'string' &&
    (p.status === 'solved' || p.status === 'failed') &&
    typeof p.attempts === 'number' &&
    typeof p.firstTrySolved === 'boolean' &&
    typeof p.usedHint === 'boolean'
  )
}

export async function getPuzzleProgress(id: string): Promise<PuzzleProgress | null> {
  const db = await getDb()
  const rec = await db.get('puzzles', id)
  return isProgress(rec) ? rec : null
}

export async function listPuzzleProgress(): Promise<PuzzleProgress[]> {
  const db = await getDb()
  const all = (await db.getAll('puzzles')) as unknown[]
  return all.filter(isProgress)
}

/** Ids of every puzzle the player has solved. */
export async function solvedPuzzleIds(): Promise<Set<string>> {
  const all = await listPuzzleProgress()
  return new Set(all.filter((p) => p.status === 'solved').map((p) => p.id))
}

/**
 * Saves the result of one finished attempt, merged with earlier attempts, and counts the
 * activity day. Read and write happen in one transaction. Returns null if storage fails,
 * so a full disk never breaks the puzzle screen.
 */
export async function recordPuzzleAttempt(
  id: string,
  attempt: AttemptSummary,
  now = Date.now(),
): Promise<PuzzleProgress | null> {
  try {
    const db = await getDb()
    const tx = db.transaction('puzzles', 'readwrite')
    const existingRec = await tx.store.get(id)
    const existing = isProgress(existingRec) ? existingRec : undefined
    const next = mergeAttempt(id, existing, attempt, now)
    await tx.store.put(next)
    await tx.done
    await recordActivity(dateKey(now))
    return next
  } catch {
    return null
  }
}
