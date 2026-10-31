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

describe('promotion picker', () => {
  const battle = (startFen: string, playerColor: 'w' | 'b') => ({
    version: 1 as const,
    startFen,
    moves: [],
    playerColor,
    difficulty: 'medium' as const,
    opponent: 'frog' as const,
    theme: 'dark' as const,
    startedAt: 1,
    updatedAt: 2,
  })

  beforeEach(() => {
    timing.minThinkMs = 0
  })

  it('opens the picker instead of committing, then commits the chosen piece', async () => {
    useGameStore.getState().resume(battle('8/P6k/8/8/8/8/8/K7 w - - 0 1', 'w'))
    expect(useGameStore.getState().playerMove('a7', 'a8')).toBe(false)
    expect(useGameStore.getState().pendingPromotion).toEqual({ from: 'a7', to: 'a8' })
    expect(useGameStore.getState().moves).toHaveLength(0)

    useGameStore.getState().choosePromotion('n')
    expect(useGameStore.getState().pendingPromotion).toBeNull()
    expect(useGameStore.getState().moves[0]).toMatchObject({ san: 'a8=N', promotion: 'n', by: 'player' })
    await untilPlayerTurn()
  })

  it('keeps the same piece identity and restores the pawn on undo', async () => {
    useGameStore.getState().resume(battle('8/P6k/8/8/8/8/8/K7 w - - 0 1', 'w'))
    useGameStore.getState().playerMove('a7', 'a8')
    useGameStore.getState().choosePromotion('q')
    await untilPlayerTurn()

    const promoted = useGameStore.getState().pieces.find((p) => p.id === 'wp1')
    expect(promoted).toMatchObject({ type: 'q', square: 'a8' })

    useGameStore.getState().undo()
    const restored = useGameStore.getState().pieces.find((p) => p.id === 'wp1')
    expect(restored).toMatchObject({ type: 'p', square: 'a7' })
  })

  it('cancelling commits nothing and keeps the game going', () => {
    useGameStore.getState().resume(battle('8/P6k/8/8/8/8/8/K7 w - - 0 1', 'w'))
    useGameStore.getState().playerMove('a7', 'a8')
    useGameStore.getState().cancelPromotion()
    expect(useGameStore.getState().pendingPromotion).toBeNull()
    expect(useGameStore.getState().moves).toHaveLength(0)
    expect(useGameStore.getState().phase).toBe('player')
  })

  it('promotes for Black as well', async () => {
    // Black pawn on a2 promotes on a1. The white king on h8 is far away.
    useGameStore.getState().resume(battle('7K/8/8/8/8/8/p7/7k b - - 0 1', 'b'))
    useGameStore.getState().playerMove('a2', 'a1')
    expect(useGameStore.getState().pendingPromotion).toEqual({ from: 'a2', to: 'a1' })
    useGameStore.getState().choosePromotion('q')
    // The new queen checks the white king along the long diagonal, so SAN ends with "+".
    expect(useGameStore.getState().moves[0]).toMatchObject({ promotion: 'q', by: 'player' })
    expect(useGameStore.getState().moves[0].san).toBe('a1=Q+')
    await untilPlayerTurn()
  })
})
