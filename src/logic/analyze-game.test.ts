import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { AnalysisCancelled, analyzeRecord, positionsFor, type Evaluate } from './analyze-game'
import { buildGameRecord, type GameRecord } from './game-record'
import { criticalMoments } from './review'

const START = new Chess().fen()

/** Equal evaluation everywhere; the "best" move is the first legal move, as in the store tests. */
const fakeEngine: Evaluate = async (fen) => {
  const m = new Chess(fen).moves({ verbose: true })[0]
  return { cp: 0, mate: null, best: m ? m.from + m.to + (m.promotion ?? '') : null }
}

function unanalyzed(): GameRecord {
  // 1. e4 e5 2. Qh5 (a plain move, not the engine's best) Nc6, saved without evaluations.
  return buildGameRecord({
    startedAt: 1,
    endedAt: 2,
    startFen: START,
    playerColor: 'w',
    difficulty: 'easy',
    opponent: 'frog',
    moves: [
      { from: 'e2', to: 'e4', san: 'e4', by: 'player' },
      { from: 'e7', to: 'e5', san: 'e5', by: 'opponent' },
      { from: 'd1', to: 'h5', san: 'Qh5', by: 'player' },
      { from: 'b8', to: 'c6', san: 'Nc6', by: 'opponent' },
    ],
    outcome: { result: 'draw', reason: 'Draw' },
  })
}

describe('positionsFor', () => {
  it('gives the start plus one position per ply', () => {
    const rec = unanalyzed()
    const positions = positionsFor(rec.startFen, rec.moves)
    expect(positions).toHaveLength(rec.moves.length + 1)
    expect(positions[0]).toBe(START)
  })
})

describe('analyzeRecord', () => {
  it('scores every position, regrades the player moves, and marks the game analyzed', async () => {
    const rec = unanalyzed()
    expect(rec.analyzed).toBe(false)
    const updated = await analyzeRecord(rec, fakeEngine)
    expect(updated.analyzed).toBe(true)
    const playerPlies = updated.moves.filter((m) => m.by === 'player')
    expect(playerPlies.every((m) => m.winBefore !== undefined && m.winAfter !== undefined && m.grade)).toBe(true)
    expect(updated.moves.every((m) => m.winAfter !== undefined)).toBe(true)
    const graded = Object.values(updated.gradeCounts).reduce((a, b) => a + b, 0)
    expect(graded).toBe(playerPlies.length)
  })

  it('reports progress with one call per unique position', async () => {
    const rec = unanalyzed()
    const seen: number[] = []
    await analyzeRecord(rec, fakeEngine, { onProgress: (done) => seen.push(done) })
    expect(seen[seen.length - 1]).toBe(seen.length)
    expect(seen.length).toBe(new Set(positionsFor(rec.startFen, rec.moves)).size)
  })

  it('stops when cancelled', async () => {
    const ctrl = new AbortController()
    ctrl.abort()
    await expect(analyzeRecord(unanalyzed(), fakeEngine, { signal: ctrl.signal })).rejects.toBeInstanceOf(
      AnalysisCancelled,
    )
  })

  it('scores finished positions without asking the engine', async () => {
    // Fool's mate: 1. f3 e5 2. g4 Qh4#. The final position is checkmate, so the engine must not be called on it.
    const fools = buildGameRecord({
      startedAt: 3,
      endedAt: 4,
      startFen: START,
      playerColor: 'w',
      difficulty: 'easy',
      opponent: 'frog',
      moves: [
        { from: 'f2', to: 'f3', san: 'f3', by: 'player' },
        { from: 'e7', to: 'e5', san: 'e5', by: 'opponent' },
        { from: 'g2', to: 'g4', san: 'g4', by: 'player' },
        { from: 'd8', to: 'h4', san: 'Qh4#', by: 'opponent' },
      ],
      outcome: { result: 'loss', reason: 'Checkmate' },
    })
    const finalFen = positionsFor(fools.startFen, fools.moves).at(-1)!
    const engine: Evaluate = async (fen) => {
      if (fen === finalFen) throw new Error('engine called on a finished position')
      return fakeEngine(fen)
    }
    const updated = await analyzeRecord(fools, engine)
    expect(updated.moves.at(-1)?.winAfter).toBe(0) // the side to move is mated, so the player is losing
  })
})

describe('criticalMoments', () => {
  it('lists the biggest drops first, with the better move in SAN', () => {
    const rec: GameRecord = {
      ...unanalyzed(),
      moves: [
        { uci: 'e2e4', san: 'e4', by: 'player', winBefore: 50, winAfter: 48, grade: 'best', bestBefore: 'e2e4' },
        { uci: 'e7e5', san: 'e5', by: 'opponent', winAfter: 48 },
        { uci: 'd1h5', san: 'Qh5', by: 'player', winBefore: 48, winAfter: 20, grade: 'blunder', bestBefore: 'g1f3' },
      ],
    }
    const positions = positionsFor(rec.startFen, rec.moves)
    const moments = criticalMoments(rec, positions)
    expect(moments).toHaveLength(1)
    expect(moments[0]).toMatchObject({ ply: 2, drop: 28, bestSan: 'Nf3', bestUci: 'g1f3' })
  })

  it('returns nothing for a flat game', () => {
    const rec = unanalyzed()
    expect(criticalMoments(rec, positionsFor(rec.startFen, rec.moves))).toEqual([])
  })
})
