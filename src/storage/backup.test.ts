import { describe, expect, it } from 'vitest'
import { validateBackup, BACKUP_SCHEMA } from './backup'

const game = {
  id: 'game-1',
  startedAt: 1,
  endedAt: 2,
  result: 'win',
  reason: 'checkmate',
  playerColor: 'w',
  difficulty: 'easy',
  opponent: 'frog',
  startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  moves: [],
  accuracy: 80,
  gradeCounts: { best: 1, great: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
  analyzed: true,
}

const valid = {
  schema: BACKUP_SCHEMA,
  exportedAt: '2026-01-01T00:00:00.000Z',
  settings: { theme: 'light', sound: 'yes', defaultColor: 'b' },
  games: [game],
  puzzles: [{ id: 'p1' }],
  lessons: [{ lessonId: 'basics-1' }],
  activityDays: ['2026-01-01', 'not a date', '2026-01-01'],
}

describe('validateBackup', () => {
  it('accepts a valid backup and keeps only valid settings and dates', () => {
    const b = validateBackup(valid)
    expect(b.games).toHaveLength(1)
    expect(b.settings).toEqual({ theme: 'light', defaultColor: 'b' }) // 'yes' is not a boolean
    expect(b.activityDays).toEqual(['2026-01-01'])
  })

  it('rejects a file that is not a backup', () => {
    expect(() => validateBackup('hello')).toThrow('not a ChessMate backup')
    expect(() => validateBackup({ ...valid, schema: 99 })).toThrow('different version')
  })

  it('rejects damaged records before anything is written', () => {
    expect(() => validateBackup({ ...valid, games: [{ id: 'x' }] })).toThrow('game history')
    expect(() => validateBackup({ ...valid, puzzles: [{ noId: true }] })).toThrow('puzzle progress')
    expect(() => validateBackup({ ...valid, lessons: [{}] })).toThrow('lesson progress')
  })
})
