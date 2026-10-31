// Build-time puzzle checks. Shared by scripts/build-puzzles.ts and the tests.
// Keep this file free of path aliases (`@/...`) so the script can load it directly.
import { Chess } from 'chess.js'

/** Compact row stored in the bundled JSON: [id, fen, moves, rating, themes]. */
export type PuzzleRow = [id: string, fen: string, moves: string[], rating: number, themes: string[]]

/**
 * Lichess themes ChessMate offers, in priority order. The first match is a puzzle's
 * "primary" theme, used to balance each bucket across themes and to label it in the list.
 */
export const THEME_PRIORITY = [
  'mateIn1',
  'mateIn2',
  'mateIn3',
  'backRankMate',
  'fork',
  'pin',
  'skewer',
  'discoveredAttack',
  'hangingPiece',
  'sacrifice',
  'promotion',
  'endgame',
] as const

export const primaryTheme = (themes: string[]): string | null =>
  THEME_PRIORITY.find((t) => themes.includes(t)) ?? null

/**
 * Checks one puzzle with chess.js. Returns null when it is valid, or the reason it was rejected.
 *
 * Lichess conventions: `fen` is the position before the opponent's first move, `moves[0]` is that
 * move, and the player moves at odd indexes. A solution therefore has an even length and ends with
 * a player move. Every move must be legal in sequence. A mate-in-one puzzle must end in checkmate.
 */
export function validatePuzzleRow(row: PuzzleRow): string | null {
  const [, fen, moves, , themes] = row
  let game: Chess
  try {
    game = new Chess(fen)
  } catch {
    return 'invalid FEN'
  }
  if (moves.length === 0 || moves.length % 2 !== 0) return 'solution has an odd number of moves'
  if (game.isGameOver()) return 'position is already over'

  for (let i = 0; i < moves.length; i++) {
    const uci = moves[i]
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return `bad move format: ${uci}`
    try {
      game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    } catch {
      return `illegal move ${uci} at ply ${i + 1}`
    }
  }
  if (themes.includes('mateIn1') && !game.isCheckmate()) {
    return 'mate-in-one puzzle does not end in checkmate'
  }
  return null
}
