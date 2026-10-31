import { Chess } from 'chess.js'

export type TrackId = 'basics' | 'tactics' | 'openings' | 'endgames'

export type Track = { id: TrackId; title: string; blurb: string }

export type Arrow = { from: string; to: string }
export type Highlight = { square: string; color?: string }

export type TextStep = { type: 'text'; title?: string; body: string }
export type DemoStep = {
  type: 'demo'
  title?: string
  body: string
  fen: string
  /** UCI moves played in order, animated when the player presses play. */
  moves?: string[]
  arrows?: Arrow[]
  highlights?: Highlight[]
}
export type TryStep = {
  type: 'try-it'
  title?: string
  body: string
  fen: string
  /** Any of these UCI moves is accepted. */
  answers: string[]
  hint: string
  success: string
}
export type QuizStep = {
  type: 'quiz'
  question: string
  options: string[]
  /** Index into `options`. */
  answer: number
  explanation: string
}
export type LessonStep = TextStep | DemoStep | TryStep | QuizStep

export type Lesson = {
  id: string
  title: string
  track: TrackId
  /** Order inside the track. */
  order: number
  practice?: { label: string; theme: string }
  steps: LessonStep[]
}

export type LessonProgress = { lessonId: string; stepsDone: number; completedAt?: number }

export type LessonState = 'locked' | 'new' | 'in-progress' | 'done'

const SQUARE = /^[a-h][1-8]$/
const UCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/

/** Problems in one lesson, for the content test. An empty list means the lesson is valid. */
export function validateLesson(lesson: Lesson, trackIds: string[]): string[] {
  const problems: string[] = []
  const at = lesson.id
  if (!trackIds.includes(lesson.track)) problems.push(`${at}: unknown track ${lesson.track}`)
  if (lesson.steps.length === 0) problems.push(`${at}: no steps`)

  const checkFen = (fen: string, where: string) => {
    try {
      new Chess(fen)
    } catch {
      problems.push(`${at}: ${where} has an invalid FEN`)
    }
  }
  /** Plays UCI moves from `fen`, returning the first illegal move, or null. */
  const playMoves = (fen: string, moves: string[], where: string) => {
    const game = new Chess(fen)
    for (const uci of moves) {
      if (!UCI.test(uci)) return `${at}: ${where} has a malformed move ${uci}`
      try {
        game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
      } catch {
        return `${at}: ${where} has an illegal move ${uci}`
      }
    }
    return null
  }

  lesson.steps.forEach((step, i) => {
    const where = `step ${i + 1} (${step.type})`
    if (step.type === 'text') {
      if (!step.body) problems.push(`${at}: ${where} has no text`)
      return
    }
    if (step.type === 'quiz') {
      if (step.options.length < 2) problems.push(`${at}: ${where} needs at least two options`)
      if (step.answer < 0 || step.answer >= step.options.length) {
        problems.push(`${at}: ${where} answer index is out of range`)
      }
      return
    }
    checkFen(step.fen, where)
    if (step.type === 'demo') {
      const err = playMoves(step.fen, step.moves ?? [], where)
      if (err) problems.push(err)
      for (const a of step.arrows ?? []) {
        if (!SQUARE.test(a.from) || !SQUARE.test(a.to)) problems.push(`${at}: ${where} has a bad arrow`)
      }
      for (const h of step.highlights ?? []) {
        if (!SQUARE.test(h.square)) problems.push(`${at}: ${where} has a bad highlight`)
      }
    }
    if (step.type === 'try-it') {
      if (step.answers.length === 0) problems.push(`${at}: ${where} has no answers`)
      for (const uci of step.answers) {
        const err = playMoves(step.fen, [uci], where)
        if (err) problems.push(err)
      }
    }
  })
  return problems
}

/** Position to show at step `index`: the nearest FEN at or before it, otherwise the first one after it. */
export function boardFenAt(steps: LessonStep[], index: number): string | null {
  for (let i = index; i >= 0; i--) {
    const s = steps[i]
    if ('fen' in s) return s.fen
  }
  for (let i = index + 1; i < steps.length; i++) {
    const s = steps[i]
    if ('fen' in s) return s.fen
  }
  return null
}

/** Lessons in each track, ordered. A lesson is locked until the one before it is done. */
export function lessonStates(
  lessons: Lesson[],
  progress: Map<string, LessonProgress>,
): Map<string, LessonState> {
  const states = new Map<string, LessonState>()
  const byTrack = new Map<string, Lesson[]>()
  for (const l of lessons) {
    const list = byTrack.get(l.track) ?? []
    list.push(l)
    byTrack.set(l.track, list)
  }
  for (const list of byTrack.values()) {
    list.sort((a, b) => a.order - b.order)
    list.forEach((lesson, i) => {
      const p = progress.get(lesson.id)
      const done = p?.completedAt !== undefined
      const previousDone = i === 0 || progress.get(list[i - 1].id)?.completedAt !== undefined
      let state: LessonState
      if (done) state = 'done'
      else if (!previousDone) state = 'locked'
      else if (p && p.stepsDone > 0) state = 'in-progress'
      else state = 'new'
      states.set(lesson.id, state)
    })
  }
  return states
}

/** Share of a track's lessons that are done, from 0 to 100. */
export function trackPercent(trackLessons: Lesson[], progress: Map<string, LessonProgress>): number {
  if (trackLessons.length === 0) return 0
  const done = trackLessons.filter((l) => progress.get(l.id)?.completedAt !== undefined).length
  return Math.round((done / trackLessons.length) * 100)
}

/** Folds one finished step into progress. Completing the last step sets `completedAt` once. */
export function mergeLessonStep(
  existing: LessonProgress | undefined,
  lessonId: string,
  stepsDone: number,
  total: number,
  now: number,
): LessonProgress {
  const done = Math.max(existing?.stepsDone ?? 0, Math.min(stepsDone, total))
  const completedAt = existing?.completedAt ?? (done >= total ? now : undefined)
  return { lessonId, stepsDone: done, completedAt }
}
