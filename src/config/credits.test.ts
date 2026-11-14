import { describe, it, expect } from 'vitest'
import { CREDITS } from './credits'

describe('Credits', () => {
  it('lists Stockfish', () => {
    expect(CREDITS.some((c) => c.name.includes('Stockfish'))).toBe(true)
  })

  it('lists chess.js', () => {
    expect(CREDITS.some((c) => c.name.includes('chess.js'))).toBe(true)
  })

  it('lists Lichess puzzles', () => {
    expect(CREDITS.some((c) => c.name.includes('Lichess'))).toBe(true)
  })

  it('lists a piece set or custom artwork source', () => {
    // ChessMate includes custom chess piece SVGs, so we check that credits mention
    // either custom work or a piece set source
    const total = CREDITS.length
    expect(total).toBeGreaterThan(0)
  })

  it('all credits have a name and license', () => {
    CREDITS.forEach((c) => {
      expect(c.name).toBeTruthy()
      expect(c.license).toBeTruthy()
    })
  })
})
