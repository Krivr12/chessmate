import { getMeta, setMeta } from './meta'
import type { BadgeId } from '@/logic/badges'

export const DEFAULT_NAME = 'Player'
export const MAX_NAME_LENGTH = 24
const PROFILE_KEY = 'profile'
const BADGES_KEY = 'badges'

/** Display name (D7). Defaults to "Player" until the player edits it. */
export async function getDisplayName(): Promise<string> {
  const p = await getMeta<{ name?: unknown }>(PROFILE_KEY)
  return typeof p?.name === 'string' && p.name.trim() ? p.name : DEFAULT_NAME
}

/** Trims and limits the name. An empty name is saved as the default. */
export async function setDisplayName(name: string): Promise<string> {
  const clean = name.trim().slice(0, MAX_NAME_LENGTH) || DEFAULT_NAME
  await setMeta(PROFILE_KEY, { name: clean })
  return clean
}

/** Badges the player has already been told about. Used to show the unlock toast once. */
export async function getSeenBadges(): Promise<BadgeId[]> {
  const v = await getMeta<unknown[]>(BADGES_KEY)
  return Array.isArray(v) ? (v.filter((x): x is BadgeId => typeof x === 'string') as BadgeId[]) : []
}

export async function setSeenBadges(ids: BadgeId[]): Promise<void> {
  await setMeta(BADGES_KEY, [...new Set(ids)])
}
