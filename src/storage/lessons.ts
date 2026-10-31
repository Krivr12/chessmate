import { dateKey } from '@/logic/activity'
import { mergeLessonStep, type LessonProgress } from '@/logic/learn'
import { recordActivity } from './activity'
import { getDb } from './db'

const isProgress = (v: unknown): v is LessonProgress => {
  if (!v || typeof v !== 'object') return false
  const p = v as Partial<LessonProgress>
  return typeof p.lessonId === 'string' && typeof p.stepsDone === 'number'
}

export async function listLessonProgress(): Promise<LessonProgress[]> {
  const db = await getDb()
  const all = (await db.getAll('lessons')) as unknown[]
  return all.filter(isProgress)
}

/**
 * Saves how far the player got in a lesson. Finishing the last step marks the lesson done and
 * counts the day. Returns null when storage fails, so the lesson keeps working.
 */
export async function saveLessonStep(
  lessonId: string,
  stepsDone: number,
  total: number,
  now = Date.now(),
): Promise<LessonProgress | null> {
  try {
    const db = await getDb()
    const tx = db.transaction('lessons', 'readwrite')
    const rec = await tx.store.get(lessonId)
    const existing = isProgress(rec) ? rec : undefined
    const next = mergeLessonStep(existing, lessonId, stepsDone, total, now)
    await tx.store.put(next)
    await tx.done
    if (next.completedAt !== undefined && existing?.completedAt === undefined) {
      await recordActivity(dateKey(now))
    }
    return next
  } catch {
    return null
  }
}
