import { isGameRecord, type GameRecord } from '@/logic/game-record'
import { isDateKey } from '@/logic/activity'
import { isDifficulty } from '@/logic/difficulty'
import type { Settings } from '@/store/settings-store'
import { getDb } from './db'
import { getActivityDays, ACTIVITY_KEY } from './activity'

export const BACKUP_SCHEMA = 1

export type Backup = {
  schema: typeof BACKUP_SCHEMA
  exportedAt: string
  /** Only the known settings keys. The current battle is never included. */
  settings: Partial<Settings>
  games: GameRecord[]
  puzzles: { id: string }[]
  lessons: { lessonId: string }[]
  activityDays: string[]
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Keeps only settings keys with the right type. Anything else is dropped. */
function pickSettings(raw: unknown): Partial<Settings> {
  if (!isObject(raw)) return {}
  const out: Partial<Settings> = {}
  if (raw.theme === 'dark' || raw.theme === 'light' || raw.theme === 'system') out.theme = raw.theme
  if (typeof raw.sound === 'boolean') out.sound = raw.sound
  if (typeof raw.haptics === 'boolean') out.haptics = raw.haptics
  if (typeof raw.showHints === 'boolean') out.showHints = raw.showHints
  if (typeof raw.highlightLastMove === 'boolean') out.highlightLastMove = raw.highlightLastMove
  if (isDifficulty(raw.defaultDifficulty)) out.defaultDifficulty = raw.defaultDifficulty
  if (raw.defaultColor === 'w' || raw.defaultColor === 'b' || raw.defaultColor === 'random') {
    out.defaultColor = raw.defaultColor
  }
  return out
}

/**
 * Checks an imported file before anything is written. Throws an Error with a readable message
 * if the file is not a ChessMate backup of a supported version or any record is malformed.
 */
export function validateBackup(raw: unknown): Backup {
  if (!isObject(raw)) throw new Error('This file is not a ChessMate backup.')
  if (raw.schema !== BACKUP_SCHEMA) throw new Error('This backup is from a different version of ChessMate.')
  if (!Array.isArray(raw.games) || !raw.games.every(isGameRecord)) {
    throw new Error('The game history in this file is damaged.')
  }
  if (!Array.isArray(raw.puzzles) || !raw.puzzles.every((p) => isObject(p) && typeof p.id === 'string')) {
    throw new Error('The puzzle progress in this file is damaged.')
  }
  if (!Array.isArray(raw.lessons) || !raw.lessons.every((l) => isObject(l) && typeof l.lessonId === 'string')) {
    throw new Error('The lesson progress in this file is damaged.')
  }
  const days = Array.isArray(raw.activityDays) ? raw.activityDays.filter(isDateKey) : []
  return {
    schema: BACKUP_SCHEMA,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    settings: pickSettings(raw.settings),
    games: raw.games,
    puzzles: raw.puzzles as { id: string }[],
    lessons: raw.lessons as { lessonId: string }[],
    activityDays: [...new Set(days)].sort(),
  }
}

/** Serializes everything the app stores (not the current battle) to JSON text. */
export async function exportBackup(settings: Settings): Promise<string> {
  const db = await getDb()
  const backup: Backup = {
    schema: BACKUP_SCHEMA,
    exportedAt: new Date().toISOString(),
    settings,
    games: (await db.getAll('games')) as GameRecord[],
    puzzles: (await db.getAll('puzzles')) as { id: string }[],
    lessons: (await db.getAll('lessons')) as { lessonId: string }[],
    activityDays: await getActivityDays(),
  }
  return JSON.stringify(backup, null, 2)
}

/**
 * Replaces stored history, puzzles, lessons, and activity days with the backup's contents.
 * Everything is validated first, then written in one transaction, so a failure leaves the old data in place.
 * Returns the settings so the caller can apply them (the theme is skipped during a battle).
 */
export async function importBackup(text: string): Promise<Partial<Settings>> {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  const backup = validateBackup(parsed)
  const db = await getDb()
  const tx = db.transaction(['games', 'puzzles', 'lessons', 'meta'], 'readwrite')
  await tx.objectStore('games').clear()
  await tx.objectStore('puzzles').clear()
  await tx.objectStore('lessons').clear()
  for (const g of backup.games) await tx.objectStore('games').put(g)
  for (const p of backup.puzzles) await tx.objectStore('puzzles').put(p as never)
  for (const l of backup.lessons) await tx.objectStore('lessons').put(l as never)
  await tx.objectStore('meta').put({ key: ACTIVITY_KEY, value: backup.activityDays })
  await tx.done
  return backup.settings
}
