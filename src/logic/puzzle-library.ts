import { primaryTheme, type PuzzleRow } from './puzzle-validate'
import { puzzleFromRow, type Puzzle } from './puzzle-flow'

export const PUZZLE_LEVELS = ['easy', 'medium', 'hard'] as const
export type PuzzleLevel = (typeof PUZZLE_LEVELS)[number]
export type PuzzleFilter = 'all' | PuzzleLevel

export const LEVEL_LABEL: Record<PuzzleLevel, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

/** Friendly names for the Lichess themes ChessMate uses (plan M29). */
const THEME_LABEL: Record<string, string> = {
  mateIn1: 'Mate in 1',
  mateIn2: 'Mate in 2',
  mateIn3: 'Mate in 3',
  backRankMate: 'Back-rank mate',
  fork: 'Fork win',
  pin: 'Pin',
  skewer: 'Skewer',
  discoveredAttack: 'Discovered attack',
  hangingPiece: 'Hanging piece',
  sacrifice: 'Sacrifice',
  promotion: 'Promotion',
  endgame: 'Endgame',
}

export const themeLabel = (theme: string) => THEME_LABEL[theme] ?? theme

/** Label for a puzzle's main theme, e.g. "Mate in 2". */
export function puzzleThemeLabel(puzzle: Pick<Puzzle, 'themes'>): string {
  const t = primaryTheme(puzzle.themes)
  return t ? themeLabel(t) : 'Tactic'
}

export type PuzzleEntry = Puzzle & { level: PuzzleLevel }

// Each bucket is its own chunk, so the app only downloads the levels the player opens.
const LOADERS: Record<PuzzleLevel, () => Promise<{ default: { rows: unknown } }>> = {
  easy: () => import('@/data/puzzles/easy.json'),
  medium: () => import('@/data/puzzles/medium.json'),
  hard: () => import('@/data/puzzles/hard.json'),
}

const cache = new Map<PuzzleLevel, Promise<PuzzleEntry[]>>()

/** One difficulty bucket, loaded once. */
export function loadPuzzles(level: PuzzleLevel): Promise<PuzzleEntry[]> {
  let p = cache.get(level)
  if (!p) {
    p = LOADERS[level]().then((mod) => {
      const rows = mod.default.rows as PuzzleRow[]
      return rows.map((r) => ({ ...puzzleFromRow(r), level }))
    })
    // A failed load can be retried.
    p.catch(() => cache.delete(level))
    cache.set(level, p)
  }
  return p
}

/** The puzzles for a filter ("all" merges the three buckets), in the order they are stored. */
export async function loadFiltered(filter: PuzzleFilter): Promise<PuzzleEntry[]> {
  const levels = filter === 'all' ? PUZZLE_LEVELS : [filter]
  const parts = await Promise.all(levels.map(loadPuzzles))
  return parts.flat()
}

/** Finds a puzzle by id across all buckets. */
export async function findPuzzle(id: string): Promise<PuzzleEntry | null> {
  const all = await loadFiltered('all')
  return all.find((p) => p.id === id) ?? null
}
