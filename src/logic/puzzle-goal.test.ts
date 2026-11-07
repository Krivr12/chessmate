import { describe, expect, it } from 'vitest'
import { getPuzzleGoal, puzzleProgressSegments } from './puzzle-goal'

describe('getPuzzleGoal', () => {
  it('returns mate in 1 goal with opponent color', () => {
    const goal = getPuzzleGoal(['mateIn1'], 'w')
    expect(goal.title).toBe('Mate in 1')
    expect(goal.body).toBe('Checkmate the black king in 1 move.')
  })

  it('returns mate in 2 goal with opponent color', () => {
    const goal = getPuzzleGoal(['mateIn2'], 'b')
    expect(goal.title).toBe('Mate in 2')
    expect(goal.body).toBe('Checkmate the white king in 2 moves.')
  })

  it('returns mate in 3+ goal with opponent color', () => {
    const goal3 = getPuzzleGoal(['mateIn3'], 'w')
    expect(goal3.title).toBe('Mate in 3')
    expect(goal3.body).toBe('Checkmate the black king in 3 moves.')

    const goal5 = getPuzzleGoal(['mateIn5'], 'b')
    expect(goal5.title).toBe('Mate in 5')
    expect(goal5.body).toBe('Checkmate the white king in 5 moves.')
  })

  it('prioritizes mate-in-N over other themes', () => {
    const goal = getPuzzleGoal(['fork', 'mateIn2', 'pin'], 'w')
    expect(goal.title).toBe('Mate in 2')
    expect(goal.body).toContain('black king')
  })

  it('returns checkmate goal for mate patterns without revealing pattern name', () => {
    const backRank = getPuzzleGoal(['backRankMate'], 'w')
    expect(backRank.title).toBe('Find checkmate')
    expect(backRank.body).toBe('Checkmate the black king.')
    expect(backRank.body).not.toContain('back-rank')

    const smothered = getPuzzleGoal(['smotheredMate'], 'b')
    expect(smothered.title).toBe('Find checkmate')
    expect(smothered.body).toBe('Checkmate the white king.')
    expect(smothered.body).not.toContain('smothered')
  })

  it('returns "Win material" for tactical themes without revealing tactic name', () => {
    const tactics = ['hangingPiece', 'fork', 'pin', 'skewer', 'discoveredAttack', 'trappedPiece', 'sacrifice']
    
    for (const tactic of tactics) {
      const goal = getPuzzleGoal([tactic], 'w')
      expect(goal.title).toBe('Win material')
      expect(goal.body).toBe('Find the move that wins material.')
      expect(goal.body.toLowerCase()).not.toContain(tactic.toLowerCase())
    }
  })

  it('returns promotion goal', () => {
    const goal = getPuzzleGoal(['promotion'], 'b')
    expect(goal.title).toBe('Promote a pawn')
    expect(goal.body).toBe('Find the way to promote a pawn safely.')
  })

  it('returns defensive move goal', () => {
    const goal = getPuzzleGoal(['defensiveMove'], 'w')
    expect(goal.title).toBe('Defend')
    expect(goal.body).toBe('Find the only move that saves your position.')
  })

  it('returns advantage goal for crushing or advantage themes', () => {
    const crushing = getPuzzleGoal(['crushing'], 'b')
    expect(crushing.title).toBe('Gain an advantage')
    expect(crushing.body).toBe('Find the strongest move.')

    const advantage = getPuzzleGoal(['advantage'], 'w')
    expect(advantage.title).toBe('Gain an advantage')
    expect(advantage.body).toBe('Find the strongest move.')
  })

  it('returns equality goal', () => {
    const goal = getPuzzleGoal(['equality'], 'w')
    expect(goal.title).toBe('Hold the position')
    expect(goal.body).toBe('Find the move that keeps the game level.')
  })

  it('returns fallback goal when no specific theme matches', () => {
    const goal = getPuzzleGoal(['endgame', 'quietMove'], 'w')
    expect(goal.title).toBe('Find the best move')
    expect(goal.body).toBe('Find the strongest move for your side.')
  })

  it('returns fallback goal for empty themes array', () => {
    const goal = getPuzzleGoal([], 'b')
    expect(goal.title).toBe('Find the best move')
    expect(goal.body).toBe('Find the strongest move for your side.')
  })

  it('uses correct opponent color based on player color', () => {
    const whiteGoal = getPuzzleGoal(['mateIn1'], 'w')
    expect(whiteGoal.body).toContain('black king')

    const blackGoal = getPuzzleGoal(['mateIn1'], 'b')
    expect(blackGoal.body).toContain('white king')
  })

  it('does not include "You play X" text in body', () => {
    const themes = ['mateIn1', 'fork', 'promotion', 'defensiveMove']
    
    for (const theme of themes) {
      const whiteGoal = getPuzzleGoal([theme], 'w')
      expect(whiteGoal.body).not.toContain('You play')
      
      const blackGoal = getPuzzleGoal([theme], 'b')
      expect(blackGoal.body).not.toContain('You play')
    }
  })

  it('handles player as Black correctly', () => {
    const goal = getPuzzleGoal(['mateIn3', 'fork'], 'b')
    expect(goal.title).toBe('Mate in 3')
    expect(goal.body).toBe('Checkmate the white king in 3 moves.')
  })

  it('uses singular "move" for mate in 1', () => {
    const goal = getPuzzleGoal(['mateIn1'], 'w')
    expect(goal.body).toBe('Checkmate the black king in 1 move.')
    expect(goal.body).not.toContain('moves')
  })

  it('uses plural "moves" for mate in 2+', () => {
    const goal2 = getPuzzleGoal(['mateIn2'], 'w')
    expect(goal2.body).toContain('2 moves')

    const goal4 = getPuzzleGoal(['mateIn4'], 'w')
    expect(goal4.body).toContain('4 moves')
  })
})

describe('puzzleProgressSegments', () => {
  it('calculates segments for mate in 1 (2 total moves)', () => {
    // Opponent move, then player move
    expect(puzzleProgressSegments(2)).toBe(1)
  })

  it('calculates segments for mate in 2 (4 total moves)', () => {
    // Opponent, player, opponent, player
    expect(puzzleProgressSegments(4)).toBe(2)
  })

  it('calculates segments for mate in 3 (6 total moves)', () => {
    // Opponent, player, opponent, player, opponent, player
    expect(puzzleProgressSegments(6)).toBe(3)
  })

  it('calculates segments for odd total moves (5 moves)', () => {
    // Opponent, player, opponent, player, opponent (incomplete)
    // Player makes 2 moves
    expect(puzzleProgressSegments(5)).toBe(2)
  })

  it('handles edge case with only 1 move', () => {
    expect(puzzleProgressSegments(1)).toBe(0)
  })

  it('handles edge case with 0 moves', () => {
    expect(puzzleProgressSegments(0)).toBe(0)
  })

  it('calculates segments for longer puzzles', () => {
    // 8 moves = opponent, p1, o, p2, o, p3, o, p4
    expect(puzzleProgressSegments(8)).toBe(4)
    
    // 9 moves = opponent, p1, o, p2, o, p3, o, p4, o
    expect(puzzleProgressSegments(9)).toBe(4)
    
    // 10 moves = opponent, p1, o, p2, o, p3, o, p4, o, p5
    expect(puzzleProgressSegments(10)).toBe(5)
  })
})
