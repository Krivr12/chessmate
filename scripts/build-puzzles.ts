/**
 * Builds the bundled puzzle sets from the Lichess puzzle database (CC0).
 *
 * Run by hand, not during the app build:
 *   node --experimental-strip-types scripts/build-puzzles.ts [path/to/lichess_db_puzzle.csv]
 *
 * The default input is .cache/lichess_db_puzzle.csv. The file is git-ignored and never committed.
 * A .csv.zst input also works on Node 22.15+ or 23.8+, which can decompress zstd.
 *
 * Output: src/data/puzzles/{easy,medium,hard}.json, one compact row per puzzle.
 */
import { createReadStream, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import * as zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { primaryTheme, THEME_PRIORITY, validatePuzzleRow, type PuzzleRow } from '../src/logic/puzzle-validate.ts'

// ---- Tuning -----------------------------------------------------------------
const PER_BUCKET = 600
/** Lower deviation means the rating is more reliable. */
const MAX_RATING_DEVIATION = 80
/** Lichess popularity is 0 to 100. */
const MIN_POPULARITY = 90
const MIN_PLAYS = 1000

type Level = 'easy' | 'medium' | 'hard'
const BUCKETS: { level: Level; min: number; max: number }[] = [
  { level: 'easy', min: 0, max: 1299 },
  { level: 'medium', min: 1300, max: 1799 },
  { level: 'hard', min: 1800, max: Infinity },
]

// ---- Input ------------------------------------------------------------------
const root = fileURLToPath(new URL('..', import.meta.url))
const input = process.argv[2] ?? join(root, '.cache', 'lichess_db_puzzle.csv')
const outDir = join(root, 'src', 'data', 'puzzles')

type Candidate = {
  id: string
  fen: string
  moves: string[]
  rating: number
  rd: number
  popularity: number
  plays: number
  themes: string[]
  primary: string
}

async function* readLines(path: string): AsyncGenerator<string> {
  let stream: NodeJS.ReadableStream = createReadStream(path)
  if (path.endsWith('.zst')) {
    // Node 22.15+ and 23.8+ provide zstd. Older versions need the file decompressed first.
    const createZstd = (zlib as Record<string, unknown>).createZstdDecompress as (() => NodeJS.ReadWriteStream) | undefined
    if (!createZstd) {
      throw new Error('This Node version cannot read .zst. Decompress the file first, or use Node 22.15+.')
    }
    stream = stream.pipe(createZstd())
  }
  for await (const line of createInterface({ input: stream, crlfDelay: Infinity })) yield line
}

function bucketOf(rating: number) {
  return BUCKETS.find((b) => rating >= b.min && rating <= b.max)?.level
}

/** Reads the CSV and keeps puzzles that pass the quality filter and have a whitelisted theme. */
async function collect(): Promise<Map<Level, Candidate[]>> {
  const byLevel = new Map<Level, Candidate[]>(BUCKETS.map((b) => [b.level, []]))
  let rows = 0
  let kept = 0
  let first = true
  for await (const line of readLines(input)) {
    if (first) {
      first = false
      if (line.startsWith('PuzzleId')) continue
    }
    rows++
    const f = line.split(',')
    if (f.length < 8) continue
    const [id, fen, moves, ratingS, rdS, popS, playsS, themesS] = f
    const rating = Number(ratingS)
    const rd = Number(rdS)
    const popularity = Number(popS)
    const plays = Number(playsS)
    if (rd > MAX_RATING_DEVIATION || popularity < MIN_POPULARITY || plays < MIN_PLAYS) continue
    const level = bucketOf(rating)
    if (!level) continue
    const themes = themesS.split(' ').filter((t) => (THEME_PRIORITY as readonly string[]).includes(t))
    const primary = primaryTheme(themes)
    if (!primary) continue
    byLevel.get(level)!.push({ id, fen, moves: moves.split(' '), rating, rd, popularity, plays, themes, primary })
    kept++
  }
  console.log(`Read ${rows.toLocaleString()} rows. Passed the quality filter and theme whitelist: ${kept.toLocaleString()}.`)
  return byLevel
}

/**
 * Picks up to PER_BUCKET valid puzzles, spreading them across themes. Within a theme, the most
 * popular and most reliable puzzles come first. Each pick is checked with chess.js.
 */
function selectBalanced(level: Level, candidates: Candidate[]) {
  const groups = new Map<string, Candidate[]>()
  for (const c of candidates) {
    const g = groups.get(c.primary) ?? []
    g.push(c)
    groups.set(c.primary, g)
  }
  for (const g of groups.values()) {
    g.sort((a, b) => b.popularity - a.popularity || a.rd - b.rd || b.plays - a.plays)
  }

  const rows: PuzzleRow[] = []
  const perTheme = new Map<string, number>()
  const rejected = new Map<string, number>()
  const order = THEME_PRIORITY.filter((t) => groups.has(t))
  const cursor = new Map<string, number>(order.map((t) => [t, 0]))

  let progressed = true
  while (rows.length < PER_BUCKET && progressed) {
    progressed = false
    for (const theme of order) {
      if (rows.length >= PER_BUCKET) break
      const group = groups.get(theme)!
      let i = cursor.get(theme)!
      while (i < group.length) {
        const c = group[i++]
        const row: PuzzleRow = [c.id, c.fen, c.moves, c.rating, c.themes]
        const problem = validatePuzzleRow(row)
        if (problem) {
          const reason = problem.startsWith('illegal move') ? 'illegal move' : problem
          rejected.set(reason, (rejected.get(reason) ?? 0) + 1)
          continue
        }
        rows.push(row)
        perTheme.set(theme, (perTheme.get(theme) ?? 0) + 1)
        progressed = true
        break
      }
      cursor.set(theme, i)
    }
  }

  rows.sort((a, b) => a[3] - b[3])
  console.log(`\n${level}: ${rows.length} puzzles (candidates ${candidates.length})`)
  for (const [theme, n] of perTheme) console.log(`  ${theme.padEnd(18)} ${n}`)
  if (rejected.size) console.log(`  rejected by chess.js: ${[...rejected].map(([r, n]) => `${r} x${n}`).join(', ')}`)
  return rows
}

function writeBucket(level: Level, rows: PuzzleRow[]) {
  mkdirSync(outDir, { recursive: true })
  const body = rows.map((r) => `  ${JSON.stringify(r)}`).join(',\n')
  const json = `{
"source": "Lichess puzzle database, https://database.lichess.org/ (CC0)",
"level": "${level}",
"count": ${rows.length},
"rows": [
${body}
]
}
`
  writeFileSync(join(outDir, `${level}.json`), json)
}

async function main() {
  statSync(input) // fails with a clear message when the file is missing
  const byLevel = await collect()
  for (const b of BUCKETS) {
    const rows = selectBalanced(b.level, byLevel.get(b.level) ?? [])
    writeBucket(b.level, rows)
  }
  console.log(`\nWrote ${outDir}`)
}

await main()
