import { useEffect, useMemo, useState } from 'react'
import type { PieceSymbol, Square } from 'chess.js'
import { ArrowLeft, CircleCheck, CircleX, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { BoardSurface, type BoardView } from '@/components/chess/chessboard'
import { CoachBubble } from '@/components/opponent/coach-bubble'
import { Button } from '@/components/ui/button'
import { lessonById } from '@/content/learn'
import { attemptMove, checkSquareOf, NO_SELECTION, tapSquare, type Selection } from '@/logic/board-input'
import { initialPieces, piecesFromMoves } from '@/logic/board-pieces'
import { boardFenAt, type DemoStep, type Lesson, type LessonStep, type LessonProgress, type QuizStep, type TryStep } from '@/logic/learn'
import { OPPONENTS, opponentForTheme } from '@/logic/opponents'
import { cn } from '@/lib/utils'
import { listLessonProgress, saveLessonStep } from '@/storage/lessons'
import { useEffectiveTheme } from '@/store/theme'

const DEMO_STEP_MS = 900
const HIGHLIGHT = '#79F2C6'

function toMove(uci: string) {
  return { from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci[4] as PieceSymbol | undefined }
}

/** A board with no interaction, used by text and quiz steps. */
function staticView(fen: string): BoardView {
  return {
    pieces: initialPieces(fen),
    selected: null,
    legalTargets: [],
    lastMove: null,
    checkSquare: checkSquareOf(fen),
    hint: null,
    pendingPromotion: null,
    promotionColor: 'w',
    selectSquare: () => {},
    choosePromotion: () => {},
    cancelPromotion: () => {},
  }
}

/** Route entry: loads the lesson and resumes where the player stopped. */
export default function Lesson() {
  const { lessonId = '' } = useParams()
  const lesson = lessonById(lessonId)
  if (!lesson) {
    return (
      <main className="flex flex-1 flex-col items-center gap-4 px-6 pt-10 text-center">
        <h1 className="text-xl font-bold text-text-primary">Lesson not found</h1>
        <Button asChild variant="outline">
          <Link to="/learn">Back to Learn</Link>
        </Button>
      </main>
    )
  }
  return <LessonSession key={lesson.id} lesson={lesson} />
}

function LessonSession({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate()
  const theme = useEffectiveTheme()
  const opponent = OPPONENTS[opponentForTheme(theme)]
  const total = lesson.steps.length

  const [ready, setReady] = useState(false)
  const [index, setIndex] = useState(0)
  const [completed, setCompleted] = useState(false)

  // Resume at the first step not yet finished. A completed lesson starts from the beginning.
  useEffect(() => {
    let cancelled = false
    void listLessonProgress().then((list: LessonProgress[]) => {
      if (cancelled) return
      const p = list.find((x) => x.lessonId === lesson.id)
      if (p && p.completedAt === undefined && p.stepsDone > 0) {
        setIndex(Math.min(p.stepsDone, total - 1))
      }
      setCompleted(p?.completedAt !== undefined)
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [lesson.id, total])

  const step = lesson.steps[index]
  const boardFen = useMemo(() => boardFenAt(lesson.steps, index), [lesson.steps, index])

  const next = async () => {
    const saving = saveLessonStep(lesson.id, index + 1, total)
    if (index + 1 >= total) {
      await saving
      setCompleted(true)
      return
    }
    setIndex(index + 1)
    await saving
  }

  if (!ready) return <p className="px-4 pt-6 text-sm text-text-secondary">Loading lesson...</p>

  if (completed && index + 1 >= total) {
    return <Completion lesson={lesson} onBack={() => navigate('/learn')} />
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-4">
      <header className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link to="/learn" aria-label="Back to Learn">
            <ArrowLeft strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="flex-1 truncate text-center text-base font-semibold text-text-primary">{lesson.title}</h1>
        <span className="w-10" aria-hidden="true" />
      </header>

      <div className="flex flex-col gap-1">
        <div
          className="flex gap-1"
          role="progressbar"
          aria-label="Lesson progress"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          {lesson.steps.map((_, i) => (
            <span key={i} className={cn('h-1.5 flex-1 rounded-full', i <= index ? 'bg-primary' : 'bg-muted')} />
          ))}
        </div>
        <p className="text-xs text-text-secondary">
          Step {index + 1} of {total}
        </p>
      </div>

      {step.type === 'demo' ? (
        <DemoPanel key={index} step={step} opponent={opponent.id} onNext={next} isLast={index + 1 >= total} />
      ) : step.type === 'try-it' ? (
        <TryPanel key={index} step={step} opponent={opponent.id} onNext={next} isLast={index + 1 >= total} />
      ) : (
        <>
          {boardFen && (
            <BoardSurface view={staticView(boardFen)} flipped={false} locked label="Lesson board" />
          )}
          {step.type === 'quiz' ? (
            <QuizPanel key={index} step={step} opponent={opponent.id} onNext={next} isLast={index + 1 >= total} />
          ) : (
            <TextPanel step={step} opponent={opponent.id} onNext={next} isLast={index + 1 >= total} />
          )}
        </>
      )}
    </main>
  )
}

/** Speech bubble with the animal narrating the step. */
function NextButton({ onClick, isLast, disabled = false }: { onClick: () => void; isLast: boolean; disabled?: boolean }) {
  return (
    <Button size="lg" onClick={onClick} disabled={disabled}>
      {isLast ? 'Finish lesson' : 'Next'}
    </Button>
  )
}

function TextPanel({ step, opponent, onNext, isLast }: { step: LessonStep & { type: 'text' }; opponent: 'frog' | 'cat'; onNext: () => void; isLast: boolean }) {
  return (
    <>
      <CoachBubble opponent={opponent} mood="idle" title={step.title}>
        {step.body}
      </CoachBubble>
      <div className="mt-auto">
        <NextButton onClick={onNext} isLast={isLast} />
      </div>
    </>
  )
}

/** Demo: a position with optional highlights and arrows. Play animates the moves. */
function DemoPanel({ step, opponent, onNext, isLast }: { step: DemoStep; opponent: 'frog' | 'cat'; onNext: () => void; isLast: boolean }) {
  const moves = useMemo(() => step.moves ?? [], [step.moves])
  const [ply, setPly] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const playing = autoPlay && ply < moves.length

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => setPly((n) => n + 1), DEMO_STEP_MS)
    return () => clearTimeout(t)
  }, [playing, ply])

  const pieces = useMemo(
    () => piecesFromMoves(step.fen, moves.slice(0, ply).map(toMove)),
    [step.fen, moves, ply],
  )
  const last = ply > 0 ? toMove(moves[ply - 1]) : null
  const highlights = Object.fromEntries((step.highlights ?? []).map((h) => [h.square, h.color ?? HIGHLIGHT]))
  const view: BoardView = { ...staticView(step.fen), pieces, lastMove: last ? { from: last.from, to: last.to } : null, checkSquare: null }

  return (
    <>
      <CoachBubble opponent={opponent} mood={playing ? 'think' : 'idle'} title={step.title}>
        {step.body}
      </CoachBubble>
      <BoardSurface
        view={view}
        flipped={false}
        locked
        highlights={highlights}
        arrows={(step.arrows ?? []).map((a) => ({ from: a.from as Square, to: a.to as Square, color: HIGHLIGHT }))}
        label="Demo board"
      />
      {moves.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (playing) setAutoPlay(false)
              else {
                if (ply >= moves.length) setPly(0)
                setAutoPlay(true)
              }
            }}
          >
            {playing ? <Pause strokeWidth={1.8} aria-hidden="true" /> : <Play strokeWidth={1.8} aria-hidden="true" />}
            {playing ? 'Pause' : ply >= moves.length && ply > 0 ? 'Replay' : 'Play moves'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setAutoPlay(false)
              setPly(0)
            }}
            disabled={ply === 0}
          >
            <RotateCcw strokeWidth={1.8} aria-hidden="true" />
            Reset
          </Button>
        </div>
      )}
      <div className="mt-auto">
        <NextButton onClick={onNext} isLast={isLast} />
      </div>
    </>
  )
}

/** Try it: the player must find one of the accepted moves. A wrong move is not played. */
function TryPanel({ step, opponent, onNext, isLast }: { step: TryStep; opponent: 'frog' | 'cat'; onNext: () => void; isLast: boolean }) {
  const color = step.fen.split(' ')[1] === 'w' ? 'w' : 'b'
  const [pos, setPos] = useState({ fen: step.fen, pieces: initialPieces(step.fen), lastMove: null as { from: Square; to: Square } | null })
  const [selection, setSelection] = useState<Selection>(NO_SELECTION)
  const [promoting, setPromoting] = useState<{ from: Square; to: Square } | null>(null)
  const [status, setStatus] = useState<'idle' | 'wrong' | 'right'>('idle')
  const [showHint, setShowHint] = useState(false)

  const tryMove = (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => {
    const attempt = attemptMove(pos.fen, pos.pieces, from, to, promotion)
    if (attempt.kind === 'promotion') {
      setPromoting({ from, to })
      return
    }
    if (attempt.kind !== 'moved') return
    setPromoting(null)
    setSelection(NO_SELECTION)
    const uci = from + to + (attempt.move.promotion ?? '')
    if (step.answers.includes(uci)) {
      setPos({ fen: attempt.fen, pieces: attempt.pieces, lastMove: { from, to } })
      setStatus('right')
    } else {
      setStatus('wrong')
    }
  }

  const onSquare = (sq: Square) => {
    if (status === 'right') return
    const tap = tapSquare(pos.fen, selection, sq, color)
    if (tap.type === 'select') setSelection(tap.selection)
    else tryMove(tap.from, tap.to)
  }

  const view: BoardView = {
    pieces: pos.pieces,
    selected: selection.selected,
    legalTargets: selection.legalTargets,
    lastMove: pos.lastMove,
    checkSquare: checkSquareOf(pos.fen),
    hint: null,
    pendingPromotion: promoting,
    promotionColor: color,
    selectSquare: onSquare,
    choosePromotion: (piece) => {
      if (promoting) tryMove(promoting.from, promoting.to, piece)
    },
    cancelPromotion: () => setPromoting(null),
  }

  return (
    <>
      <CoachBubble opponent={opponent} mood={status === 'right' ? 'happy' : status === 'wrong' ? 'sad' : 'idle'} title={step.title}>
        {step.body}
      </CoachBubble>
      <BoardSurface view={view} flipped={color === 'b'} label="Practice board" />
      <div className="min-h-12 text-sm" aria-live="polite">
        {status === 'right' && (
          <p className="flex items-start gap-2 text-text-primary">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-mint" strokeWidth={2} aria-hidden="true" />
            {step.success}
          </p>
        )}
        {status === 'wrong' && (
          <p className="flex items-start gap-2 text-text-primary">
            <CircleX className="mt-0.5 size-5 shrink-0 text-coral" strokeWidth={2} aria-hidden="true" />
            Not that move. Try again.
          </p>
        )}
        {status !== 'right' && showHint && (
          <p className="mt-2 flex items-start gap-2 text-text-secondary">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-yellow" strokeWidth={1.8} aria-hidden="true" />
            {step.hint}
          </p>
        )}
      </div>
      <div className="mt-auto grid gap-2">
        {status !== 'right' && (
          <Button variant="outline" onClick={() => setShowHint(true)} disabled={showHint}>
            <Lightbulb strokeWidth={1.8} aria-hidden="true" />
            Show hint
          </Button>
        )}
        <NextButton onClick={onNext} isLast={isLast} disabled={status !== 'right'} />
      </div>
    </>
  )
}

/** Quiz: pick an answer, then read the explanation. Any choice can continue. */
function QuizPanel({ step, opponent, onNext, isLast }: { step: QuizStep; opponent: 'frog' | 'cat'; onNext: () => void; isLast: boolean }) {
  const [picked, setPicked] = useState<number | null>(null)
  const correct = picked === step.answer
  return (
    <>
      <CoachBubble opponent={opponent} mood={picked === null ? 'idle' : correct ? 'happy' : 'sad'} title="Quick check">
        {step.question}
      </CoachBubble>
      <div role="group" aria-label="Answers" className="flex flex-col gap-2">
        {step.options.map((opt, i) => (
          <Button
            key={opt}
            variant="outline"
            size="lg"
            aria-pressed={picked === i}
            onClick={() => setPicked(i)}
            className={cn('h-auto justify-start py-3 text-left whitespace-normal', picked === i && 'border-primary')}
          >
            {opt}
          </Button>
        ))}
      </div>
      {picked !== null && (
        <p className="flex items-start gap-2 text-sm text-text-primary" aria-live="polite">
          {correct ? (
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-mint" strokeWidth={2} aria-hidden="true" />
          ) : (
            <CircleX className="mt-0.5 size-5 shrink-0 text-coral" strokeWidth={2} aria-hidden="true" />
          )}
          <span>
            <strong className="font-semibold">{correct ? 'Correct. ' : 'Not quite. '}</strong>
            {step.explanation}
          </span>
        </p>
      )}
      <div className="mt-auto">
        <NextButton onClick={onNext} isLast={isLast} disabled={picked === null} />
      </div>
    </>
  )
}

function Completion({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center gap-5 px-6 pt-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-mint text-accent-foreground">
        <CircleCheck className="size-8" strokeWidth={2} aria-hidden="true" />
      </span>
      <h1 className="text-xl font-bold text-text-primary">Lesson complete</h1>
      <p className="text-sm text-text-secondary">{lesson.title} is done. Keep going to unlock the next lesson.</p>
      <div className="flex w-full flex-col gap-2">
        {lesson.practice && (
          <Button asChild size="lg">
            <Link to={`/puzzles?theme=${lesson.practice.theme}`}>{lesson.practice.label}</Link>
          </Button>
        )}
        <Button variant="outline" size="lg" onClick={onBack}>
          Back to Learn
        </Button>
      </div>
    </main>
  )
}
