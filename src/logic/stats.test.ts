import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { earnedBadges } from './badges'
import { buildGameRecord, type GameRecord } from './game-record'
import { computeStats, longestWinStreak } from './stats'

const START = new Chess().fen()

function game(
  endedAt: number,
  result: 'win' | 'loss' | 'draw',
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  grade: 'best' | 'blunder' = 'best',
  reason: 'Checkmate' | 'Draw' = 'Checkmate',
): GameRecord {
  return buildGameRecord({
    startedAt: endedAt - 1,
    endedAt,
    startFen: START,
    playerColor: 'w',
    difficulty,
    opponent: 'frog',
    moves: [
      { from: 'e2', to: 'e4', san: 'e4', by: 'player', winBefore: 50, winAfter: 60, grade },
      { from: 'e7', to: 'e5', san: 'e5', by: 'opponent', winAfter: 60 },
    ],
    outcome: { result, reason },
  })
}

describe('computeStats', () => {
  it('computes win rate, record, and streaks', () => {
    const games = [game(1, 'win'), game(2, 'win'), game(3, 'loss'), game(4, 'draw')]
    const s = computeStats(games, ['2026-03-01', '2026-03-02', '2026-03-03'], '2026-03-03')
    expect(s.winRate).toBe(50)
    expect(s.record).toMatchObject({ wins: 2, losses: 1, draws: 1, total: 4 })
    expect(s.currentDayStreak).toBe(3)
    expect(s.bestDayStreak).toBe(3)
    expect(s.bestWinStreak).toBe(2)
  })

  it('handles an empty history with a zero win rate', () => {
    const s = computeStats([], [], '2026-03-03')
    expect(s.winRate).toBe(0)
    expect(s.recentGames).toEqual([])
  })

  it('shows the 10 most recent games, oldest first', () => {
    const games = Array.from({ length: 12 }, (_, i) => game(i + 1, 'win'))
    const recent = computeStats(games, [], '2026-03-03').recentGames
    expect(recent).toHaveLength(10)
    expect(recent[0].endedAt).toBe(3)
    expect(recent[9].endedAt).toBe(12)
  })
})

describe('longestWinStreak', () => {
  it('is broken by a loss or a draw, and uses end time order', () => {
    expect(longestWinStreak([game(3, 'win'), game(1, 'win'), game(2, 'loss'), game(4, 'win')])).toBe(2)
  })
})

describe('earnedBadges', () => {
  it('unlocks the first win and the giant slayer, but not the locked ones', () => {
    const earned = earnedBadges([game(1, 'win', 'hard')], [], { puzzlesSolved: 0, learnTracksDone: 0 })
    expect(earned.has('first-win')).toBe(true)
    expect(earned.has('giant-slayer')).toBe(true)
    expect(earned.has('getting-started')).toBe(false)
    expect(earned.has('puzzle-starter')).toBe(false)
  })

  it('does not award a clean game when there was a blunder', () => {
    const earned = earnedBadges([game(1, 'win', 'easy', 'blunder')], [], { puzzlesSolved: 0, learnTracksDone: 0 })
    expect(earned.has('clean-game')).toBe(false)
  })

  it('awards the streak badges from consecutive active days', () => {
    const days = ['2026-03-01', '2026-03-02', '2026-03-03']
    const earned = earnedBadges([], days, { puzzlesSolved: 0, learnTracksDone: 0 })
    expect(earned.has('streak-3')).toBe(true)
    expect(earned.has('streak-7')).toBe(false)
  })
})
