import type { Color } from 'chess.js'

export type PuzzleGoal = {
  title: string
  body: string
}

/**
 * Returns the instructional text for a puzzle based on its themes.
 * Picks the first matching theme in priority order, with a fallback.
 * Never reveals tactic names. Always includes which side the player plays.
 */
export function getPuzzleGoal(themes: string[], playerColor: Color): PuzzleGoal {
  const opponentColor = playerColor === 'w' ? 'Black' : 'White'
  const playerSide = playerColor === 'w' ? 'White' : 'Black'
  const sideText = `You play ${playerSide}.`

  // Extract mate-in-N if present
  const mateInMatch = themes.find((t) => /^mateIn\d+$/.test(t))
  if (mateInMatch) {
    const n = mateInMatch.replace('mateIn', '')
    const moves = n === '1' ? 'move' : 'moves'
    return {
      title: `Mate in ${n}`,
      body: `Checkmate the ${opponentColor} king in ${n} ${moves}. ${sideText}`,
    }
  }

  // Checkmate patterns (don't reveal the pattern name)
  if (
    themes.some((t) =>
      [
        'backRankMate',
        'smotheredMate',
        'anastasiaMate',
        'arabianMate',
        'doubleBishopMate',
        'dovetailMate',
        'hookMate',
      ].includes(t),
    )
  ) {
    return {
      title: 'Find checkmate',
      body: `Checkmate the ${opponentColor} king. ${sideText}`,
    }
  }

  // Material-winning tactics (don't reveal the tactic name)
  if (
    themes.some((t) =>
      [
        'hangingPiece',
        'fork',
        'pin',
        'skewer',
        'discoveredAttack',
        'trappedPiece',
        'sacrifice',
        'attraction',
        'deflection',
        'removal',
        'desperado',
        'exposedKing',
        'doubleCheck',
        'capturingDefender',
      ].includes(t),
    )
  ) {
    return {
      title: 'Win material',
      body: `Find the move that wins material. ${sideText}`,
    }
  }

  // Promotion
  if (themes.includes('promotion')) {
    return {
      title: 'Promote a pawn',
      body: `Promote a pawn safely. ${sideText}`,
    }
  }

  // Defensive move
  if (themes.includes('defensiveMove')) {
    return {
      title: 'Defend',
      body: `Find the only move that saves your position. ${sideText}`,
    }
  }

  // Crushing / advantage
  if (themes.includes('crushing') || themes.includes('advantage')) {
    return {
      title: 'Find the strongest move',
      body: `Find the strongest move. ${sideText}`,
    }
  }

  // Equality
  if (themes.includes('equality')) {
    return {
      title: 'Hold the position',
      body: `Find the move that keeps the game level. ${sideText}`,
    }
  }

  // Fallback
  return {
    title: 'Find the best move',
    body: `Find the strongest move for ${playerSide}.`,
  }
}

/**
 * Calculates the number of progress segments for a puzzle.
 * One segment per move the player must make.
 * Formula: ceil((solution moves - 1) / 2)
 * - First move is always the opponent
 * - Player moves are at odd indexes (1, 3, 5...)
 */
export function puzzleProgressSegments(totalMoves: number): number {
  // Player moves are at indexes 1, 3, 5, ...
  // So we subtract the first opponent move and divide by 2
  if (totalMoves <= 1) return 0
  return Math.ceil((totalMoves - 1) / 2)
}
