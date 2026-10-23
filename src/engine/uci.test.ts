import { describe, expect, it } from 'vitest'
import { parseBestMove, parseInfoScore } from './uci'

describe('uci parsing', () => {
  it('parses cp and mate scores', () => {
    expect(
      parseInfoScore('info depth 16 seldepth 25 multipv 1 score cp 25 nodes 143351 pv e2e4 e7e5'),
    ).toEqual({ cp: 25, mate: null })
    expect(parseInfoScore('info depth 12 seldepth 2 multipv 1 score mate -3 nodes 1 pv d1d8')).toEqual({
      cp: null,
      mate: -3,
    })
  })

  it('ignores bound scores, other PVs and non-score lines', () => {
    expect(parseInfoScore('info depth 17 multipv 1 score cp 29 lowerbound nodes 1')).toBeNull()
    expect(parseInfoScore('info depth 10 multipv 2 score cp 10 nodes 1')).toBeNull()
    expect(parseInfoScore('info string NNUE evaluation using nn.nnue')).toBeNull()
    expect(parseInfoScore('readyok')).toBeNull()
  })

  it('parses bestmove lines', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toEqual({ best: 'e2e4' })
    expect(parseBestMove('bestmove a7a8q')).toEqual({ best: 'a7a8q' })
    expect(parseBestMove('bestmove (none)')).toEqual({ best: null })
    expect(parseBestMove('info depth 1')).toBeNull()
  })
})
