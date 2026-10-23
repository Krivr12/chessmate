import type { EngineScore } from '@/logic/types'

/** Parse the score from a UCI `info` line. Bound scores and secondary PVs are ignored. */
export function parseInfoScore(line: string): EngineScore | null {
  if (!line.startsWith('info ') || /\b(lowerbound|upperbound)\b/.test(line)) return null
  const multipv = line.match(/\bmultipv (\d+)/)
  if (multipv && multipv[1] !== '1') return null
  const m = line.match(/\bscore (cp|mate) (-?\d+)/)
  if (!m) return null
  const value = Number(m[2])
  return m[1] === 'cp' ? { cp: value, mate: null } : { cp: null, mate: value }
}

/** Parse a `bestmove` line. Returns null for other lines, `(none)` becomes an empty move. */
export function parseBestMove(line: string): { best: string | null } | null {
  const m = line.match(/^bestmove (\S+)/)
  if (!m) return null
  return { best: m[1] === '(none)' ? null : m[1] }
}
