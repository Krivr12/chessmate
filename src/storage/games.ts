import { isGameRecord, type GameRecord } from '@/logic/game-record'
import { dateKey } from '@/logic/activity'
import { getDb } from './db'
import { recordActivity } from './activity'

/** Writes a game. Keyed by id, so saving the same battle twice overwrites one record. */
export async function saveGame(record: GameRecord): Promise<void> {
  const db = await getDb()
  await db.put('games', record)
}

/** Every stored game, newest first. Records that fail the shape check are skipped. */
export async function listGames(): Promise<GameRecord[]> {
  const db = await getDb()
  const all = (await db.getAll('games')) as unknown[]
  return all.filter(isGameRecord).sort((a, b) => b.endedAt - a.endedAt)
}

export async function deleteGame(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('games', id)
}

/**
 * Saves a finished game and counts its day for the streak. Never throws: a storage failure
 * must not break the result screen.
 */
export async function saveFinishedGame(record: GameRecord): Promise<void> {
  try {
    await saveGame(record)
    await recordActivity(dateKey(record.endedAt))
  } catch {
    // Storage can be full or unavailable. The game still shows on the result screen.
  }
}
