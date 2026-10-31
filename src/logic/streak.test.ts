import { describe, expect, it } from 'vitest'
import { bestStreak, currentStreak, shiftDay } from './streak'

describe('currentStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(currentStreak(['2026-03-01', '2026-03-02', '2026-03-03'], '2026-03-03')).toBe(3)
  })

  it('still counts from yesterday when today has no activity yet', () => {
    expect(currentStreak(['2026-03-01', '2026-03-02'], '2026-03-03')).toBe(2)
  })

  it('is broken by a gap', () => {
    expect(currentStreak(['2026-03-01', '2026-03-03'], '2026-03-03')).toBe(1)
  })

  it('is zero with no activity, and handles empty input', () => {
    expect(currentStreak([], '2026-03-03')).toBe(0)
  })

  it('crosses month and year boundaries', () => {
    expect(currentStreak(['2025-12-31', '2026-01-01'], '2026-01-01')).toBe(2)
  })

  it('ignores malformed entries', () => {
    expect(currentStreak(['bad', '2026-03-03'], '2026-03-03')).toBe(1)
  })
})

describe('bestStreak', () => {
  it('finds the longest run, even if it is not the current one', () => {
    expect(bestStreak(['2026-01-01', '2026-01-02', '2026-01-03', '2026-02-10', '2026-02-11'])).toBe(3)
  })

  it('counts unsorted and duplicate days correctly', () => {
    expect(bestStreak(['2026-01-03', '2026-01-01', '2026-01-02', '2026-01-02'])).toBe(3)
  })

  it('is zero for no days', () => {
    expect(bestStreak([])).toBe(0)
  })
})

describe('shiftDay', () => {
  it('moves across leap days', () => {
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29')
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28')
  })
})
