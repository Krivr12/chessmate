import { Chess, type Color, type Move, type Square } from 'chess.js'
import { create } from 'zustand'
import { DEFAULT_DIFFICULTY } from '@/constants'
import { EngineCancelledError, engine, type EngineStatus } from '@/engine/engine-service'
import { applyMove, initialPieces, type PieceState } from '@/logic/board-pieces'
import { gradeMove } from '@/logic/grade-move'
import { describeHint, type HintInfo } from '@/logic/hint-text'
import { getOutcome } from '@/logic/outcome'
import { pickLine, type TalkCategory } from '@/logic/trash-talk'
import type { Difficulty, Grade, Mood, MoveRecord, Outcome, SavedBattle } from '@/logic/types'
import { playerWinPercent } from '@/logic/win-percent'
import { clearBattle, saveDifficulty } from '@/storage/battle-storage'

/** Tunable timings (tests set these to 0). */
export const timing = { minThinkMs: 700, analysisMs: 250 }

/**
 * player: waiting for the player's move. grading: analysing the player's move.
 * opponent: engine is choosing a reply. stalled: opponent must move but the
 * engine was interrupted or failed (resumes on retry or when the screen returns).
 */
export type Phase = 'idle' | 'player' | 'grading' | 'opponent' | 'stalled' | 'over'

export type Commentary = { id: number; grade: Grade | null; line: string; mood: Mood }

type Analysis = { fen: string; win: number; best: string | null }

export type GameState = {
  phase: Phase
  playerColor: Color
  difficulty: Difficulty
  startFen: string
  startedAt: number
  moves: MoveRecord[]
  redo: MoveRecord[]
  fen: string
  pieces: PieceState[]
  selected: Square | null
  legalTargets: Square[]
  lastMove: { from: Square; to: Square } | null
  checkSquare: Square | null
  analysis: Analysis | null
  winChance: number
  trend: number | null
  hint: HintInfo | null
  hintLoading: boolean
  commentary: Commentary
  outcome: Outcome | null
  engineStatus: EngineStatus
  token: number

  newGame: (difficulty: Difficulty, playerColor?: Color) => void
  resume: (battle: SavedBattle) => void
  selectSquare: (square: Square) => void
  playerMove: (from: Square, to: Square) => boolean
  undo: () => void
  redoMove: () => void
  resign: () => void
  requestHint: () => Promise<void>
  clearHint: () => void
  pause: () => void
  continueGame: () => void
  retryEngine: () => void
}

const START_FEN = new Chess().fen()
const ACTIVE: Phase[] = ['player', 'grading', 'opponent', 'stalled']
export const isActivePhase = (p: Phase) => ACTIVE.includes(p)

let game = new Chess()
const analysisCache = new Map<string, Promise<Analysis>>()
let commentId = 0

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const toUci = (m: Pick<Move, 'from' | 'to' | 'promotion'>) => m.from + m.to + (m.promotion ?? '')

function say(category: TalkCategory, grade: Grade | null, mood: Mood): Commentary {
  return { id: ++commentId, grade, line: pickLine(category), mood }
}

const GRADE_MOOD: Record<Grade, Mood> = {
  best: 'sad',
  great: 'sad',
  good: 'idle',
  inaccuracy: 'happy',
  mistake: 'happy',
  blunder: 'happy',
}

/** Frog reaction to the player's move. Big errors beat checks, checks beat captures. */
function playerMoveCommentary(grade: Grade | undefined, move: Move, prev: Commentary): Commentary {
  const g = grade ?? null
  if (grade === 'mistake' || grade === 'blunder') return say(grade, g, 'happy')
  if (move.san.includes('+')) return say('playerChecks', g, 'shock')
  if (move.captured) return say('playerCaptures', g, 'sad')
  if (grade) return say(grade, g, GRADE_MOOD[grade])
  return { ...prev, id: ++commentId, grade: null }
}

function commentaryFromHistory(moves: MoveRecord[], fallback: TalkCategory): Commentary {
  const last = [...moves].reverse().find((m) => m.by === 'player' && m.grade)
  return last?.grade ? say(last.grade, last.grade, GRADE_MOOD[last.grade]) : say(fallback, null, 'idle')
}

function kingSquare(color: Color): Square | null {
  for (const row of game.board()) {
    for (const cell of row) if (cell?.type === 'k' && cell.color === color) return cell.square
  }
  return null
}

function boardState() {
  const last = game.history({ verbose: true }).at(-1)
  return {
    fen: game.fen(),
    lastMove: last ? { from: last.from, to: last.to } : null,
    checkSquare: game.inCheck() ? kingSquare(game.turn()) : null,
    selected: null,
    legalTargets: [] as Square[],
  }
}

/** Replay a move list into the module chess instance and piece identities. */
function rebuild(startFen: string, moves: MoveRecord[]) {
  game = new Chess(startFen)
  let pieces = initialPieces(startFen)
  for (const m of moves) pieces = applyMove(pieces, game.move(m))
  return { pieces, ...boardState() }
}

function trendFrom(moves: MoveRecord[]) {
  const last = [...moves].reverse().find((m) => m.by === 'player')
  return last?.winBefore !== undefined && last.winAfter !== undefined
    ? last.winAfter - last.winBefore
    : null
}

export const useGameStore = create<GameState>()((set, get) => {
  /** Invalidate in-flight async work and stop the engine. */
  const bump = () => {
    engine.stop()
    set({ token: get().token + 1 })
    return get().token
  }

  const ensureAnalysis = (fen: string): Promise<Analysis> => {
    const playerColor = get().playerColor
    const key = playerColor + fen
    let p = analysisCache.get(key)
    if (!p) {
      const sideToMove = fen.split(' ')[1] as Color
      p = engine
        .analyze(fen, timing.analysisMs)
        .then((r) => ({ fen, best: r.best, win: playerWinPercent(r, sideToMove, playerColor) }))
      p.catch(() => analysisCache.delete(key))
      analysisCache.set(key, p)
    }
    return p
  }

  /** Analyse the current position (player to move) for the win chance and Hint cache. */
  const primeAnalysis = () => {
    const token = get().token
    const fen = game.fen()
    ensureAnalysis(fen).then(
      (a) => {
        if (token === get().token && get().fen === fen) set({ analysis: a, winChance: a.win })
      },
      () => {},
    )
  }

  const finish = (outcome: Outcome) => {
    const category: TalkCategory =
      outcome.result === 'win' ? 'playerWins' : outcome.result === 'loss' ? 'playerLoses' : 'draw'
    const mood: Mood = outcome.result === 'win' ? 'sad' : outcome.result === 'loss' ? 'happy' : 'idle'
    set({
      phase: 'over',
      outcome,
      hint: null,
      selected: null,
      legalTargets: [],
      commentary: say(category, null, mood),
    })
    void clearBattle()
  }

  const opponentTurn = async () => {
    const token = get().token
    const { difficulty, playerColor } = get()
    set({ phase: 'opponent' })
    let uci: string | null
    try {
      const [best] = await Promise.all([engine.play(game.fen(), difficulty), sleep(timing.minThinkMs)])
      uci = best
    } catch (err) {
      if (token === get().token && !(err instanceof EngineCancelledError)) set({ phase: 'stalled' })
      return
    }
    if (token !== get().token || !uci) return

    const move = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    const record: MoveRecord = {
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      san: move.san,
      by: 'opponent',
    }
    const s = get()
    let commentary = s.commentary
    if (move.san.includes('+')) commentary = say('opponentChecks', s.commentary.grade, 'happy')
    else if (move.captured) commentary = say('opponentCaptures', s.commentary.grade, 'happy')

    set({
      moves: [...s.moves, record],
      pieces: applyMove(s.pieces, move),
      ...boardState(),
      phase: 'player',
      analysis: null,
      commentary,
    })
    const outcome = getOutcome(game, playerColor)
    if (outcome) finish(outcome)
    else primeAnalysis()
  }

  const gradePlayerMove = async (index: number, move: Move, beforeFen: string) => {
    const token = get().token
    const { playerColor } = get()
    const outcome = getOutcome(game, playerColor)
    const afterFen = game.fen()

    let before: Analysis | null = null
    try {
      before = await ensureAnalysis(beforeFen)
    } catch {
      before = null
    }
    let winAfter: number | undefined
    if (outcome) winAfter = outcome.result === 'win' ? 100 : outcome.result === 'draw' ? 50 : 0
    else {
      try {
        winAfter = (await ensureAnalysis(afterFen)).win
      } catch {
        winAfter = undefined
      }
    }
    if (token !== get().token) return

    const s = get()
    const grade =
      before && winAfter !== undefined
        ? gradeMove(before.win, winAfter, before.best === toUci(move))
        : undefined
    const moves = s.moves.map((m, i) =>
      i === index ? { ...m, winBefore: before?.win, winAfter, grade } : m,
    )
    set({
      moves,
      winChance: winAfter ?? s.winChance,
      trend: trendFrom(moves),
      commentary: playerMoveCommentary(grade, move, s.commentary),
    })
    if (outcome) finish(outcome)
    else await opponentTurn()
  }

  engine.onStatus((engineStatus) => set({ engineStatus }))

  return {
    phase: 'idle',
    playerColor: 'w',
    difficulty: DEFAULT_DIFFICULTY,
    startFen: START_FEN,
    startedAt: 0,
    moves: [],
    redo: [],
    fen: START_FEN,
    pieces: initialPieces(START_FEN),
    selected: null,
    legalTargets: [],
    lastMove: null,
    checkSquare: null,
    analysis: null,
    winChance: 50,
    trend: null,
    hint: null,
    hintLoading: false,
    commentary: { id: 0, grade: null, line: '', mood: 'idle' },
    outcome: null,
    engineStatus: engine.status,
    token: 0,

    newGame: (difficulty, playerColor = 'w') => {
      bump()
      engine.newGame()
      analysisCache.clear()
      saveDifficulty(difficulty)
      void clearBattle()
      set({
        ...rebuild(START_FEN, []),
        phase: playerColor === 'w' ? 'player' : 'opponent',
        playerColor,
        difficulty,
        startFen: START_FEN,
        startedAt: Date.now(),
        moves: [],
        redo: [],
        analysis: null,
        winChance: 50,
        trend: null,
        hint: null,
        outcome: null,
        commentary: say('gameStart', null, 'idle'),
      })
      if (playerColor === 'w') primeAnalysis()
      else void opponentTurn()
    },

    resume: (battle) => {
      bump()
      engine.newGame()
      analysisCache.clear()
      const lastWin = [...battle.moves].reverse().find((m) => m.winAfter !== undefined)?.winAfter
      set({
        ...rebuild(battle.startFen, battle.moves),
        playerColor: battle.playerColor,
        difficulty: battle.difficulty,
        startFen: battle.startFen,
        startedAt: battle.startedAt,
        moves: battle.moves,
        redo: [],
        analysis: null,
        winChance: lastWin ?? 50,
        trend: trendFrom(battle.moves),
        hint: null,
        outcome: null,
        commentary: say('resume', null, 'idle'),
        phase: 'player',
      })
      const outcome = getOutcome(game, battle.playerColor)
      if (outcome) finish(outcome)
      else if (game.turn() !== battle.playerColor) void opponentTurn()
      else primeAnalysis()
    },

    selectSquare: (square) => {
      const s = get()
      if (s.phase !== 'player') return
      if (s.selected && s.legalTargets.includes(square)) {
        s.playerMove(s.selected, square)
        return
      }
      const piece = game.get(square)
      if (piece && piece.color === s.playerColor && square !== s.selected) {
        const targets = game.moves({ square, verbose: true }).map((m) => m.to)
        set({ selected: square, legalTargets: [...new Set(targets)] })
      } else {
        set({ selected: null, legalTargets: [] })
      }
    },

    playerMove: (from, to) => {
      const s = get()
      if (s.phase !== 'player' || game.turn() !== s.playerColor) return false
      const legal = game.moves({ square: from, verbose: true }).find((m) => m.to === to)
      if (!legal) return false
      const beforeFen = game.fen()
      // Auto-promote to a queen in phase 1.
      const move = game.move({ from, to, promotion: legal.promotion ? 'q' : undefined })
      const record: MoveRecord = {
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        san: move.san,
        by: 'player',
      }
      set({
        moves: [...s.moves, record],
        redo: [],
        pieces: applyMove(s.pieces, move),
        ...boardState(),
        hint: null,
        analysis: null,
        phase: 'grading',
      })
      void gradePlayerMove(s.moves.length, move, beforeFen)
      return true
    },

    undo: () => {
      const s = get()
      if (!isActivePhase(s.phase)) return
      let idx = -1
      for (let i = s.moves.length - 1; i >= 0; i--) {
        if (s.moves[i].by === 'player') {
          idx = i
          break
        }
      }
      if (idx < 0) return
      bump()
      const moves = s.moves.slice(0, idx)
      set({
        ...rebuild(s.startFen, moves),
        moves,
        redo: [...s.moves.slice(idx), ...s.redo],
        phase: 'player',
        analysis: null,
        hint: null,
        winChance: s.moves[idx].winBefore ?? s.winChance,
        trend: trendFrom(moves),
        commentary: commentaryFromHistory(moves, 'gameStart'),
      })
      primeAnalysis()
    },

    redoMove: () => {
      const s = get()
      if (s.phase !== 'player' || s.redo.length === 0) return
      let n = 1
      while (n < s.redo.length && s.redo[n].by === 'opponent') n++
      bump()
      const moves = [...s.moves, ...s.redo.slice(0, n)]
      const lastWin = [...moves].reverse().find((m) => m.winAfter !== undefined)?.winAfter
      set({
        ...rebuild(s.startFen, moves),
        moves,
        redo: s.redo.slice(n),
        analysis: null,
        hint: null,
        winChance: lastWin ?? s.winChance,
        trend: trendFrom(moves),
        commentary: commentaryFromHistory(moves, 'gameStart'),
      })
      const outcome = getOutcome(game, s.playerColor)
      if (outcome) finish(outcome)
      else if (game.turn() !== s.playerColor) void opponentTurn()
      else primeAnalysis()
    },

    resign: () => {
      if (!isActivePhase(get().phase)) return
      bump()
      finish({ result: 'loss', reason: 'Resignation' })
    },

    requestHint: async () => {
      const s = get()
      if (s.phase !== 'player') return
      const token = s.token
      const fen = game.fen()
      set({ hintLoading: true, commentary: say('hintUsed', s.commentary.grade, 'happy') })
      try {
        const a = s.analysis?.fen === fen ? s.analysis : await ensureAnalysis(fen)
        if (token !== get().token || get().fen !== fen) return
        set({ hint: a.best ? describeHint(fen, a.best) : null, analysis: a, winChance: a.win })
      } catch {
        // Engine unavailable; the sheet shows a retry message.
      } finally {
        if (token === get().token) set({ hintLoading: false })
      }
    },

    clearHint: () => set({ hint: null, hintLoading: false }),

    pause: () => {
      const { phase } = get()
      if (phase !== 'grading' && phase !== 'opponent') return
      bump()
      set({ phase: 'stalled' })
    },

    continueGame: () => {
      const s = get()
      if (s.phase === 'stalled') void opponentTurn()
      else if (s.phase === 'player' && !s.analysis) primeAnalysis()
    },

    retryEngine: () => {
      engine.retry().then(
        () => get().continueGame(),
        () => {},
      )
    },
  }
})

/** Snapshot of the current game for storage. */
export function toSavedBattle(s: GameState): SavedBattle {
  return {
    version: 1,
    startFen: s.startFen,
    moves: s.moves,
    playerColor: s.playerColor,
    difficulty: s.difficulty,
    startedAt: s.startedAt,
    updatedAt: Date.now(),
  }
}
