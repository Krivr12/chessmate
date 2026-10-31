import { Chess } from 'chess.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fake engine: analysis says "equal, best = first legal move"; the opponent plays the first legal move.
vi.mock('@/engine/engine-service', () => {
  class EngineCancelledError extends Error {}
  const firstMove = (fen: string) => {
    const m = new Chess(fen).moves({ verbose: true })[0]
    return m ? m.from + m.to + (m.promotion ?? '') : null
  }
  return {
    EngineCancelledError,
    engine: {
      status: 'ready',
      onStatus: () => () => {},
      init: async () => {},
      retry: async () => {},
      stop: () => {},
      newGame: () => {},
      analyze: async (fen: string) => ({ cp: 0, mate: null, best: firstMove(fen) }),
      play: async (fen: string) => firstMove(fen),
    },
  }
})

const { timing, useGameStore } = await import('./game-store')

const settle = () => new Promise((r) => setTimeout(r, 0))
async function untilPlayerTurn() {
  for (let i = 0; i < 50 && useGameStore.getState().phase !== 'player'; i++) await settle()
}

describe('game store', () => {
  beforeEach(() => {
    timing.minThinkMs = 0
    useGameStore.getState().newGame('medium', 'w')
  })

  it('plays a legal move, grades it and lets the opponent reply', async () => {
    expect(useGameStore.getState().playerMove('e2', 'e4')).toBe(true)
    await untilPlayerTurn()
    const s = useGameStore.getState()
    expect(s.moves).toHaveLength(2)
    expect(s.moves[0]).toMatchObject({ san: 'e4', by: 'player', grade: expect.any(String) })
    expect(s.moves[1].by).toBe('opponent')
    expect(s.lastMove).toEqual({ from: s.moves[1].from, to: s.moves[1].to })
  })

  it('rejects illegal moves and moves out of turn', async () => {
    expect(useGameStore.getState().playerMove('e2', 'e5')).toBe(false)
    expect(useGameStore.getState().playerMove('e7', 'e5')).toBe(false)
    expect(useGameStore.getState().moves).toHaveLength(0)
  })

  it('undo rewinds a full turn and redo restores it', async () => {
    useGameStore.getState().playerMove('d2', 'd4')
    await untilPlayerTurn()
    const after = useGameStore.getState()
    const fen = after.fen
    const pieces = after.pieces

    useGameStore.getState().undo()
    expect(useGameStore.getState().moves).toHaveLength(0)
    expect(useGameStore.getState().fen).toBe(new Chess().fen())

    useGameStore.getState().redoMove()
    await untilPlayerTurn()
    expect(useGameStore.getState().fen).toBe(fen)
    expect(useGameStore.getState().pieces).toEqual(pieces)

    useGameStore.getState().undo()
    useGameStore.getState().playerMove('e2', 'e4')
    expect(useGameStore.getState().redo).toHaveLength(0)
  })

  it('opens for the opponent when the player is Black', async () => {
    useGameStore.getState().newGame('easy', 'b')
    await untilPlayerTurn()
    const s = useGameStore.getState()
    expect(s.moves).toHaveLength(1)
    expect(s.moves[0].by).toBe('opponent')
  })

  it('resign ends the game as a loss', () => {
    useGameStore.getState().resign()
    expect(useGameStore.getState()).toMatchObject({
      phase: 'over',
      outcome: { result: 'loss', reason: 'Resignation' },
    })
  })

  it('resume rebuilds the position from the move list', async () => {
    useGameStore.getState().resume({
      version: 1,
      startFen: new Chess().fen(),
      moves: [
        { from: 'e2', to: 'e4', san: 'e4', by: 'player', winAfter: 55, grade: 'best' },
        { from: 'e7', to: 'e5', san: 'e5', by: 'opponent' },
      ],
      playerColor: 'w',
      difficulty: 'hard',
      opponent: 'frog',
      theme: 'dark',
      startedAt: 1,
      updatedAt: 2,
    })
    const s = useGameStore.getState()
    expect(s.phase).toBe('player')
    expect(s.difficulty).toBe('hard')
    expect(s.lastMove).toEqual({ from: 'e7', to: 'e5' })
    expect(s.winChance).toBe(55)
  })
})
