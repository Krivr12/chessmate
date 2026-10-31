import { describe, expect, it } from 'vitest'
import type { MoveRecord } from './types'
import {
  accuracyOf,
  buildGameRecord,
  gradeCountsOf,
  isAnalyzed,
  isGameRecord,
  reasonFor,
} from './game-record'
import { dateKey } from './activity'
import { latestGames, summarizeHistory } from './history'

const player = (grade: MoveRecord['grade'], extra: Partial<MoveRecord> = {}): MoveRecord => ({
  from: 'e2',
  to: 'e4',
  san: 'e4',
  by: 'player',
  winBefore: 50,
  winAfter: 55,
  grade,
  ...extra,
})
const opp = (extra: Partial<MoveRecord> = {}): MoveRecord => ({
  from: 'e7',
  to: 'e5',
  san: 'e5',
  by: 'opponent',
  winAfter: 54,
  ...extra,
})

describe('accuracy and grade counts', () => {
  it('averages grade points over player moves only', () => {
    // best 100 and blunder 0 average to 50. Opponent moves are ignored.
    expect(accuracyOf([player('best'), opp(), player('blunder')])).toBe(50)
  })

  it('is zero when nothing was graded', () => {
    expect(accuracyOf([opp()])).toBe(0)
  })

  it('counts every grade, with zeros for the rest', () => {
    const counts = gradeCountsOf([player('best'), player('best'), player('mistake'), opp()])
    expect(counts).toEqual({ best: 2, great: 0, good: 0, inaccuracy: 0, mistake: 1, blunder: 0 })
  })
})

describe('isAnalyzed', () => {
  it('is true when every move has its evaluations', () => {
    expect(isAnalyzed([player('good'), opp()])).toBe(true)
  })

  it('is false when a move is missing an evaluation (for example an MVP save)', () => {
    expect(isAnalyzed([{ from: 'e2', to: 'e4', san: 'e4', by: 'player' }])).toBe(false)
    expect(isAnalyzed([opp({ winAfter: undefined })])).toBe(false)
  })
})

describe('reasonFor', () => {
  it('maps outcome text to the stored reason', () => {
    expect(reasonFor('Checkmate')).toBe('checkmate')
    expect(reasonFor('Resignation')).toBe('resign')
    expect(reasonFor('Stalemate')).toBe('stalemate')
    expect(reasonFor('Insufficient material')).toBe('insufficient')
    expect(reasonFor('Threefold repetition')).toBe('threefold')
    expect(reasonFor('50-move rule')).toBe('fifty')
    expect(reasonFor('Draw')).toBe('draw')
  })
})

describe('buildGameRecord', () => {
  const base = {
    startedAt: 1_000,
    endedAt: 2_000,
    startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    playerColor: 'w' as const,
    difficulty: 'medium' as const,
    opponent: 'frog' as const,
  }

  it('builds one record with a stable id, the result, and the summary numbers', () => {
    const rec = buildGameRecord({
      ...base,
      moves: [player('best', { bestBefore: 'e2e4', cp: 20 }), opp()],
      outcome: { result: 'win', reason: 'Checkmate' },
    })
    expect(rec.id).toBe('game-1000')
    expect(rec.result).toBe('win')
    expect(rec.reason).toBe('checkmate')
    expect(rec.accuracy).toBe(100)
    expect(rec.gradeCounts.best).toBe(1)
    expect(rec.analyzed).toBe(true)
    expect(rec.moves[0]).toMatchObject({ uci: 'e2e4', san: 'e4', bestBefore: 'e2e4', cp: 20 })
    expect(isGameRecord(rec)).toBe(true)
  })

  it('gives the same id when built twice, so saving again overwrites one record', () => {
    const a = buildGameRecord({ ...base, moves: [player('good')], outcome: { result: 'loss', reason: 'Resignation' } })
    const b = buildGameRecord({ ...base, moves: [player('good')], outcome: { result: 'loss', reason: 'Resignation' } })
    expect(a.id).toBe(b.id)
  })
})

describe('history summary', () => {
  const rec = (result: 'win' | 'loss' | 'draw', difficulty: 'easy' | 'medium' | 'hard', endedAt: number) =>
    buildGameRecord({
      startedAt: endedAt - 10,
      endedAt,
      startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      playerColor: 'w',
      difficulty,
      opponent: 'frog',
      moves: [player('good')],
      outcome: { result, reason: result === 'draw' ? 'Stalemate' : 'Checkmate' },
    })

  it('counts results overall and per difficulty', () => {
    const games = [rec('win', 'hard', 1), rec('loss', 'hard', 2), rec('draw', 'easy', 3), rec('win', 'easy', 4)]
    const s = summarizeHistory(games)
    expect(s).toMatchObject({ total: 4, wins: 2, losses: 1, draws: 1 })
    expect(s.byDifficulty.hard).toEqual({ wins: 1, losses: 1, draws: 0 })
    expect(s.byDifficulty.easy).toEqual({ wins: 1, losses: 0, draws: 1 })
    expect(s.byDifficulty.medium).toEqual({ wins: 0, losses: 0, draws: 0 })
  })

  it('handles an empty history', () => {
    expect(summarizeHistory([])).toMatchObject({ total: 0, wins: 0, losses: 0, draws: 0 })
  })

  it('returns the latest games first without changing the input', () => {
    const games = [rec('win', 'easy', 5), rec('win', 'easy', 9), rec('loss', 'easy', 7)]
    expect(latestGames(games, 2).map((g) => g.endedAt)).toEqual([9, 7])
    expect(games[0].endedAt).toBe(5)
  })
})

describe('dateKey', () => {
  it('formats the local calendar day as YYYY-MM-DD', () => {
    const d = new Date(2026, 0, 5, 23, 59) // local time, January 5
    expect(dateKey(d.getTime())).toBe('2026-01-05')
  })
})
