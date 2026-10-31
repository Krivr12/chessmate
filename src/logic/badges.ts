import type { GameRecord } from './game-record'
import { bestStreak } from './streak'

export type BadgeId =
  | 'first-win'
  | 'getting-started'
  | 'giant-slayer'
  | 'clean-game'
  | 'comeback'
  | 'quick-mate'
  | 'streak-3'
  | 'streak-7'
  | 'puzzle-starter'
  | 'puzzle-pro'
  | 'graduate'

export const BADGES: { id: BadgeId; name: string; rule: string }[] = [
  { id: 'first-win', name: 'First win', rule: 'Win any game' },
  { id: 'getting-started', name: 'Getting started', rule: 'Finish 10 games' },
  { id: 'giant-slayer', name: 'Giant slayer', rule: 'Win on Hard' },
  { id: 'clean-game', name: 'Clean game', rule: 'Win with no mistakes or blunders' },
  { id: 'comeback', name: 'Comeback', rule: 'Win after your win chance dropped below 20%' },
  { id: 'quick-mate', name: 'Quick mate', rule: 'Win by checkmate in 25 moves or fewer' },
  { id: 'streak-3', name: 'Streak 3', rule: 'Play on 3 days in a row' },
  { id: 'streak-7', name: 'Streak 7', rule: 'Play on 7 days in a row' },
  { id: 'puzzle-starter', name: 'Puzzle starter', rule: 'Solve 10 puzzles' },
  { id: 'puzzle-pro', name: 'Puzzle pro', rule: 'Solve 100 puzzles' },
  { id: 'graduate', name: 'Graduate', rule: 'Complete a full Learn track' },
]

/** Progress from features that land in later milestones. Zero until they exist. */
export type ExtraProgress = { puzzlesSolved: number; learnTracksDone: number }

/** Badges earned by the stored data. Each rule is a pure check. */
export function earnedBadges(games: GameRecord[], activityDays: string[], extra: ExtraProgress): Set<BadgeId> {
  const earned = new Set<BadgeId>()
  const wins = games.filter((g) => g.result === 'win')
  const days = bestStreak(activityDays)

  if (wins.length >= 1) earned.add('first-win')
  if (games.length >= 10) earned.add('getting-started')
  if (wins.some((g) => g.difficulty === 'hard')) earned.add('giant-slayer')
  if (wins.some((g) => g.moves.filter((m) => m.by === 'player').every((m) => m.grade !== 'mistake' && m.grade !== 'blunder' && m.grade !== undefined))) {
    earned.add('clean-game')
  }
  if (wins.some((g) => g.moves.some((m) => m.winAfter !== undefined && m.winAfter < 20))) earned.add('comeback')
  if (wins.some((g) => g.reason === 'checkmate' && g.moves.filter((m) => m.by === 'player').length <= 25)) {
    earned.add('quick-mate')
  }
  if (days >= 3) earned.add('streak-3')
  if (days >= 7) earned.add('streak-7')
  if (extra.puzzlesSolved >= 10) earned.add('puzzle-starter')
  if (extra.puzzlesSolved >= 100) earned.add('puzzle-pro')
  if (extra.learnTracksDone >= 1) earned.add('graduate')
  return earned
}
