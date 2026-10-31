import type { IDBPDatabase, IDBPTransaction } from 'idb'

/** Schema of the `chessmate` database. Each entry runs once, in order, when upgrading past its version. */
export const DB_NAME = 'chessmate'
export const CURRENT_VERSION = 1

export type ChessmateSchema = {
  games: { key: string; value: unknown; indexes: { endedAt: number } }
  puzzles: { key: string; value: unknown; indexes: { status: string } }
  lessons: { key: string; value: unknown }
  meta: { key: string; value: unknown }
}

type Tx = IDBPTransaction<ChessmateSchema, (keyof ChessmateSchema)[], 'versionchange'>

export type Migration = {
  version: number
  name: string
  up: (db: IDBPDatabase<ChessmateSchema>, tx: Tx) => void
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'create stores',
    up: (db) => {
      if (!db.objectStoreNames.contains('games')) {
        const games = db.createObjectStore('games', { keyPath: 'id' })
        games.createIndex('endedAt', 'endedAt')
      }
      if (!db.objectStoreNames.contains('puzzles')) {
        const puzzles = db.createObjectStore('puzzles', { keyPath: 'id' })
        puzzles.createIndex('status', 'status')
      }
      if (!db.objectStoreNames.contains('lessons')) {
        db.createObjectStore('lessons', { keyPath: 'lessonId' })
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' })
      }
    },
  },
]

/**
 * Migrations that must run to go from `from` to `to`.
 * Throws if the list is not strictly numbered from 1, so a bad edit fails loudly in tests.
 */
export function pendingMigrations(from: number, to: number, list: Migration[] = MIGRATIONS): Migration[] {
  list.forEach((m, i) => {
    if (m.version !== i + 1) throw new Error(`Migration ${i + 1} has version ${m.version}`)
  })
  if (to > list.length) throw new Error(`Database version ${to} has no migration list`)
  return list.filter((m) => m.version > from && m.version <= to)
}
