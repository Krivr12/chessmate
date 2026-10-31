import { getDb } from './db'

/** Keys stored in the `meta` object store. */
export const META_KEYS = {
  hasSeenWelcome: 'hasSeenWelcome',
} as const

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDb()
  const record = (await db.get('meta', key)) as { value?: unknown } | undefined
  return record?.value as T | undefined
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb()
  await db.put('meta', { key, value })
}
