import type { Chess, Color } from 'chess.js'
import type { Outcome } from './types'

/** Game result from the player's point of view, or null while the game continues. */
export function getOutcome(game: Chess, playerColor: Color): Outcome | null {
  if (game.isCheckmate()) {
    return game.turn() === playerColor
      ? { result: 'loss', reason: 'Checkmate' }
      : { result: 'win', reason: 'Checkmate' }
  }
  if (game.isStalemate()) return { result: 'draw', reason: 'Stalemate' }
  if (game.isInsufficientMaterial()) return { result: 'draw', reason: 'Insufficient material' }
  if (game.isThreefoldRepetition()) return { result: 'draw', reason: 'Threefold repetition' }
  if (game.isDrawByFiftyMoves()) return { result: 'draw', reason: '50-move rule' }
  if (game.isDraw()) return { result: 'draw', reason: 'Draw' }
  return null
}
