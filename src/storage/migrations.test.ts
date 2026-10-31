import { describe, expect, it } from 'vitest'
import { MIGRATIONS, pendingMigrations, CURRENT_VERSION, type Migration } from './migrations'

const fake = (version: number): Migration => ({ version, name: `m${version}`, up: () => {} })

describe('pendingMigrations', () => {
  it('runs every migration on a fresh database', () => {
    expect(pendingMigrations(0, CURRENT_VERSION).map((m) => m.version)).toEqual(
      MIGRATIONS.map((m) => m.version),
    )
  })

  it('runs nothing when already current', () => {
    expect(pendingMigrations(CURRENT_VERSION, CURRENT_VERSION)).toEqual([])
  })

  it('runs only the versions after the old one, in order', () => {
    const list = [fake(1), fake(2), fake(3)]
    expect(pendingMigrations(1, 3, list).map((m) => m.version)).toEqual([2, 3])
  })

  it('rejects a migration list that is not numbered from 1', () => {
    expect(() => pendingMigrations(0, 2, [fake(1), fake(3)])).toThrow()
  })

  it('rejects a target version with no migrations', () => {
    expect(() => pendingMigrations(0, 4, [fake(1)])).toThrow()
  })
})
