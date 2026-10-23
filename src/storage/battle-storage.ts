import { Chess } from 'chess.js'
import { del, get, set } from 'idb-keyval'
import { DEFAULT_DIFFICULTY } from '@/constants'
import { isDifficulty } from '@/logic/difficulty'
import type { Difficulty, SavedBattle } from '@/logic/types'

const BATTLE_KEY = 'battle:current'
const DIFFICULTY_KEY = 'chessmate:difficulty'
const GRADES = ['best', 'great', 'good', 'inaccuracy', 'mistake', 'blunder']

/** Validate an unknown record. Anything malformed, unknown-version or illegal is "no save". */
export function parseSavedBattle(raw: unknown): SavedBattle | null {
  if (!raw || typeof raw !== 'object') return null
  const b = raw as Partial<SavedBattle>
  if (b.version !== 1 || typeof b.startFen !== 'string' || !Array.isArray(b.moves)) return null
  if ((b.playerColor !== 'w' && b.playerColor !== 'b') || !isDifficulty(b.difficulty)) return null
  try {
    const game = new Chess(b.startFen)
    for (const m of b.moves) {
      if (m.by !== 'player' && m.by !== 'opponent') return null
      if (m.grade !== undefined && !GRADES.includes(m.grade)) return null
      game.move({ from: m.from, to: m.to, promotion: m.promotion })
    }
  } catch {
    return null
  }
  return {
    version: 1,
    startFen: b.startFen,
    moves: b.moves,
    playerColor: b.playerColor,
    difficulty: b.difficulty,
    startedAt: Number(b.startedAt) || Date.now(),
    updatedAt: Number(b.updatedAt) || Date.now(),
  }
}

export async function saveBattle(battle: SavedBattle): Promise<void> {
  try {
    await set(BATTLE_KEY, battle)
  } catch {
    // Storage can fail in private browsing. Saving is best-effort.
  }
}

export async function loadBattle(): Promise<SavedBattle | null> {
  try {
    return parseSavedBattle(await get(BATTLE_KEY))
  } catch {
    return null
  }
}

export async function clearBattle(): Promise<void> {
  try {
    await del(BATTLE_KEY)
  } catch {
    // ignore
  }
}

let persistRequested = false
/** Ask the browser not to evict our data. Called once. */
export function requestPersistentStorage() {
  if (persistRequested) return
  persistRequested = true
  try {
    void navigator.storage?.persist?.().catch(() => {})
  } catch {
    // ignore
  }
}

export function loadDifficulty(): Difficulty {
  try {
    const v = localStorage.getItem(DIFFICULTY_KEY)
    return isDifficulty(v) ? v : DEFAULT_DIFFICULTY
  } catch {
    return DEFAULT_DIFFICULTY
  }
}

export function saveDifficulty(d: Difficulty) {
  try {
    localStorage.setItem(DIFFICULTY_KEY, d)
  } catch {
    // ignore
  }
}
