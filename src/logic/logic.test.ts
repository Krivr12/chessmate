import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { gameAccuracy, moveAccuracy } from './accuracy'
import { gradeMove } from './grade-move'
import { describeHint } from './hint-text'
import { getOutcome } from './outcome'
import { pickLine, trashTalk, type TalkCategory } from './trash-talk'
import { playerWinPercent, roundWin, winPercent } from './win-percent'

describe('winPercent', () => {
  it('matches reference values', () => {
    expect(winPercent(0)).toBe(50)
    expect(roundWin(winPercent(100))).toBe(59)
    expect(roundWin(winPercent(300))).toBe(75)
    expect(roundWin(winPercent(-300))).toBe(25)
  })

  it('normalizes the side-to-move score to the player', () => {
    expect(roundWin(playerWinPercent({ cp: 300, mate: null }, 'w', 'w'))).toBe(75)
    expect(roundWin(playerWinPercent({ cp: 300, mate: null }, 'b', 'w'))).toBe(25)
    expect(roundWin(playerWinPercent({ cp: 300, mate: null }, 'b', 'b'))).toBe(75)
  })

  it('handles mate scores', () => {
    expect(playerWinPercent({ cp: null, mate: 3 }, 'w', 'w')).toBe(100)
    expect(playerWinPercent({ cp: null, mate: -2 }, 'w', 'w')).toBe(0)
    expect(playerWinPercent({ cp: null, mate: 2 }, 'b', 'w')).toBe(0)
    expect(playerWinPercent({ cp: null, mate: 0 }, 'b', 'w')).toBe(100)
    expect(playerWinPercent({ cp: null, mate: 0 }, 'w', 'w')).toBe(0)
  })
})

describe('gradeMove', () => {
  it('uses the threshold table', () => {
    expect(gradeMove(60, 59.5, false)).toBe('best')
    expect(gradeMove(60, 59, false)).toBe('great')
    expect(gradeMove(60, 57.1, false)).toBe('great')
    expect(gradeMove(60, 57, false)).toBe('good')
    expect(gradeMove(60, 54, false)).toBe('inaccuracy')
    expect(gradeMove(60, 50, false)).toBe('mistake')
    expect(gradeMove(60, 41, false)).toBe('mistake')
    expect(gradeMove(60, 40, false)).toBe('blunder')
  })

  it('treats the engine best move and gains as best', () => {
    expect(gradeMove(60, 20, true)).toBe('best')
    expect(gradeMove(40, 70, false)).toBe('best')
  })
})

describe('accuracy', () => {
  it('is about 100 with no drop and near 0 for huge drops', () => {
    expect(moveAccuracy(0)).toBeCloseTo(100, 0)
    expect(moveAccuracy(-5)).toBeCloseTo(100, 0)
    expect(moveAccuracy(100)).toBeLessThan(2)
    expect(moveAccuracy(1000)).toBe(0)
  })

  it('averages graded player moves only', () => {
    expect(gameAccuracy([])).toBeNull()
    const acc = gameAccuracy([
      { from: 'e2', to: 'e4', san: 'e4', by: 'player', winBefore: 50, winAfter: 50 },
      { from: 'e7', to: 'e5', san: 'e5', by: 'opponent' },
      { from: 'g1', to: 'f3', san: 'Nf3', by: 'player' },
    ])
    expect(acc).toBeCloseTo(100, 0)
  })
})

describe('getOutcome', () => {
  it('detects checkmate for both sides', () => {
    const fools = new Chess()
    for (const m of ['f3', 'e5', 'g4', 'Qh4#']) fools.move(m)
    expect(getOutcome(fools, 'w')).toEqual({ result: 'loss', reason: 'Checkmate' })
    expect(getOutcome(fools, 'b')).toEqual({ result: 'win', reason: 'Checkmate' })
  })

  it('detects stalemate and insufficient material', () => {
    expect(getOutcome(new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'), 'w')?.reason).toBe('Stalemate')
    expect(getOutcome(new Chess('8/8/8/4k3/8/8/4K3/8 w - - 0 1'), 'w')?.reason).toBe(
      'Insufficient material',
    )
    expect(getOutcome(new Chess(), 'w')).toBeNull()
  })
})

describe('trash talk', () => {
  it('has lines for every category and never repeats back to back', () => {
    for (const cat of Object.keys(trashTalk) as TalkCategory[]) {
      expect(trashTalk[cat].length).toBeGreaterThan(0)
      let prev = pickLine(cat)
      for (let i = 0; i < 20; i++) {
        const next = pickLine(cat)
        if (trashTalk[cat].length > 1) expect(next).not.toBe(prev)
        prev = next
      }
    }
  })
})

describe('describeHint', () => {
  it('converts UCI to SAN with a reason', () => {
    const start = new Chess().fen()
    expect(describeHint(start, 'g1f3')).toEqual({
      from: 'g1',
      to: 'f3',
      san: 'Nf3',
      reason: 'This improves your position',
    })
    expect(describeHint(start, 'e2e5')).toBeNull()
  })

  it('explains captures, checks, castling, promotion and mate', () => {
    expect(describeHint('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', 'e4d5')?.reason).toBe(
      'This captures a pawn',
    )
    expect(describeHint('4k3/8/8/8/8/8/8/R3K3 w Q - 0 1', 'e1c1')?.reason).toBe(
      'This castles your king to safety',
    )
    expect(describeHint('8/P7/8/8/8/8/8/k3K3 w - - 0 1', 'a7a8q')?.reason).toBe(
      'This promotes your pawn to a queen',
    )
    expect(describeHint('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'a1a8')?.reason).toBe('This gives check')
    expect(describeHint('6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', 'd1d8')?.reason).toBe(
      'This delivers checkmate',
    )
  })
})
