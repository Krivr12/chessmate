import { openDB, type IDBPDatabase } from 'idb'
import {
  CURRENT_VERSION,
  DB_NAME,
  pendingMigrations,
  MIGRATIONS,
  type ChessmateSchema,
} from './migrations'

let dbPromise: Promise<IDBPDatabase<ChessmateSchema>> | null = null

/** Opens the `chessmate` database and runs pending migrations. Shared by every storage module. */
export function getDb(): Promise<IDBPDatabase<ChessmateSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<ChessmateSchema>(DB_NAME, CURRENT_VERSION, {
      upgrade(db, oldVersion, _newVersion, tx) {
        for (const m of pendingMigrations(oldVersion, CURRENT_VERSION, MIGRATIONS)) {
          m.up(db, tx)
        }
      },
    }).catch((err) => {
      // Allow a later call to retry, for example after storage frees up.
      dbPromise = null
      throw err
    })
  }
  return dbPromise
}

/** Test helper: forget the cached connection. */
export function resetDbForTests() {
  dbPromise = null
}
