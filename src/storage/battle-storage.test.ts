import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SavedBattle } from '@/logic/types'

const db = new Map<string, unknown>()
vi.mock('idb-keyval', () => ({
  get: async (k: string) => db.get(k),
  set: async (k: string, v: unknown) => void db.set(k, v),
  del: async (k: string) => void db.delete(k),
}))

const { clearBattle, loadBattle, parseSavedBattle, saveBattle } = await import('./battle-storage')

const battle: SavedBattle = {
  version: 1,
  startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  moves: [
    { from: 'e2', to: 'e4', san: 'e4', by: 'player', winBefore: 52, winAfter: 51, grade: 'best' },
    { from: 'e7', to: 'e5', san: 'e5', by: 'opponent' },
  ],
  playerColor: 'w',
  difficulty: 'medium',
  opponent: 'frog',
  theme: 'dark',
  startedAt: 1,
  updatedAt: 2,
}

describe('battle storage', () => {
  beforeEach(() => db.clear())

  it('round-trips a battle', async () => {
    await saveBattle(battle)
    expect(await loadBattle()).toEqual(battle)
    await clearBattle()
    expect(await loadBattle()).toBeNull()
  })

  it('rejects corrupt, unknown-version and illegal records', () => {
    expect(parseSavedBattle(null)).toBeNull()
    expect(parseSavedBattle('garbage')).toBeNull()
    expect(parseSavedBattle({ ...battle, version: 2 })).toBeNull()
    expect(parseSavedBattle({ ...battle, difficulty: 'insane' })).toBeNull()
    expect(
      parseSavedBattle({ ...battle, moves: [{ from: 'e2', to: 'e5', san: 'e5', by: 'player' }] }),
    ).toBeNull()
    expect(parseSavedBattle({ ...battle, moves: [{ ...battle.moves[0], grade: 'brilliant' }] })).toBeNull()
  })
})

describe('legacy saves (MVP, before opponent and theme existed)', () => {
  it('load as the frog on the dark theme', () => {
    const legacy: Partial<SavedBattle> = { ...battle }
    delete legacy.opponent
    delete legacy.theme
    const parsed = parseSavedBattle(legacy)
    expect(parsed).not.toBeNull()
    expect(parsed?.opponent).toBe('frog')
    expect(parsed?.theme).toBe('dark')
  })
})
