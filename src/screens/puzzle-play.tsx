import { useEffect, useMemo, useRef, useState } from 'react'
import type { PieceSymbol, Square } from 'chess.js'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  House,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { BoardSurface, type BoardView } from '@/components/chess/chessboard'
import { OpponentAvatar } from '@/components/opponent/opponent-avatar'
import { Button } from '@/components/ui/button'
import { piecesFromMoves } from '@/logic/board-pieces'
import { checkSquareOf, NO_SELECTION, tapSquare, type Selection } from '@/logic/board-input'
import { OPPONENTS, opponentForTheme } from '@/logic/opponents'
import {
  attemptPuzzleMove,
  hintSquares,
  pickNextPuzzle,
  playOpponentMove,
  requestHint,
  solutionSteps,
  startPuzzle,
  type AttemptResult,
  type PuzzleState,
  type PuzzleStatus,
} from '@/logic/puzzle-flow'
import {
  LEVEL_LABEL,
  findPuzzle,
  loadFiltered,
  puzzleThemeLabel,
  type PuzzleEntry,
  type PuzzleFilter,
} from '@/logic/puzzle-library'
import { pickLine, type TalkCategory } from '@/logic/trash-talk'
import type { Mood } from '@/logic/types'
import { recordPuzzleAttempt, solvedPuzzleIds } from '@/storage/puzzles'
import { useEffectiveTheme } from '@/store/theme'
import { cn } from '@/lib/utils'

const OPPONENT_DELAY_MS = 600
const SOLUTION_STEP_MS = 900
const MOVE_ARROW_PLAYER = '#79F2C6'
const MOVE_ARROW_OPPONENT = '#FFE29A'

function parseFilter(v: string | null): PuzzleFilter {
  return v === 'easy' || v === 'medium' || v === 'hard' ? v : 'all'
}

/** Route entry. Loads the puzzle, then runs a session keyed by id so each puzzle starts clean. */
export default function PuzzlePlay() {
  const { puzzleId = '' } = useParams()
  const [params] = useSearchParams()
  const filter = parseFilter(params.get('level'))
  const [loaded, setLoaded] = useState<{ id: string; puzzle: PuzzleEntry | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    void findPuzzle(puzzleId).then((puzzle) => {
      if (!cancelled) setLoaded({ id: puzzleId, puzzle })
    })
    return () => {
      cancelled = true
    }
  }, [puzzleId])

  if (!loaded || loaded.id !== puzzleId) {
    return <p className="px-4 pt-6 text-sm text-text-secondary">Loading puzzle...</p>
  }
  if (!loaded.puzzle) {
    return (
      <main className="flex flex-1 flex-col items-center gap-4 px-6 pt-10 text-center">
        <h1 className="text-xl font-bold text-text-primary">Puzzle not found</h1>
        <p className="text-sm text-text-secondary">This puzzle is not in the bundled set.</p>
        <Button asChild variant="outline">
          <Link to="/puzzles">Back to puzzles</Link>
        </Button>
      </main>
    )
  }
  return <PuzzleSession key={puzzleId} puzzle={loaded.puzzle} filter={filter} />
}

type Line = { text: string; mood: Mood }

function PuzzleSession({ puzzle, filter }: { puzzle: PuzzleEntry; filter: PuzzleFilter }) {
  const navigate = useNavigate()
  const theme = useEffectiveTheme()
  const opponent = OPPONENTS[opponentForTheme(theme)]

  const [state, setState] = useState<PuzzleState>(() => startPuzzle(puzzle))
  const [selection, setSelection] = useState<Selection>(NO_SELECTION)
  const [promoting, setPromoting] = useState<{ from: Square; to: Square } | null>(null)
  const [attempt, setAttempt] = useState(1)
  const [line, setLine] = useState<Line>({ text: '', mood: 'idle' })
  const [viewing, setViewing] = useState(false)
  const [step, setStep] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [finished, setFinished] = useState(false)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const recordedFor = useRef(0)

  const steps = useMemo(() => solutionSteps(puzzle), [puzzle])
  const bestSan = steps.find((s) => s.by === 'player')?.san ?? ''
  const wrongSan = state.wrongSan

  // The opponent answers after a short pause, so the player can follow the position.
  useEffect(() => {
    if (state.status !== 'opponent') return
    const t = setTimeout(() => setState((s) => playOpponentMove(puzzle, s)), OPPONENT_DELAY_MS)
    return () => clearTimeout(t)
  }, [state.status, state.index, puzzle])

  // Save each finished attempt once. A solved puzzle stays solved; a failed one is kept as a retry.
  useEffect(() => {
    if (state.status !== 'solved' && state.status !== 'failed') return
    if (recordedFor.current === attempt) return
    recordedFor.current = attempt
    void recordPuzzleAttempt(puzzle.id, {
      solved: state.status === 'solved',
      mistakes: state.status === 'failed' ? 1 : 0,
      usedHint: state.usedHint,
      timeMs: Date.now() - startedAt,
    }).then((saved) => {
      if (!saved) toast.error("Couldn't save your progress on this device.")
    })
  }, [state.status, state.usedHint, attempt, puzzle.id, startedAt])

  // Solution viewer auto-advance.
  useEffect(() => {
    if (!viewing || !autoPlay || step >= steps.length) return
    const t = setTimeout(() => setStep((n) => n + 1), SOLUTION_STEP_MS)
    return () => clearTimeout(t)
  }, [viewing, autoPlay, step, steps.length])

  const say = (category: TalkCategory, mood: Mood) =>
    setLine({ text: pickLine(category, Math.random, opponent.lines), mood })

  const applyAttempt = (r: AttemptResult) => {
    if (r.kind === 'correct') {
      setState(r.state)
      setSelection(NO_SELECTION)
      if (r.state.status === 'solved') say('puzzleSolved', 'happy')
      else say('puzzleCorrect', 'happy')
    } else if (r.kind === 'wrong') {
      setState(r.state)
      setSelection(NO_SELECTION)
      say('puzzleWrong', 'sad')
    }
  }

  const onSquare = (sq: Square) => {
    if (state.status !== 'playing') return
    const tap = tapSquare(state.fen, selection, sq, state.playerColor)
    if (tap.type === 'select') {
      setSelection(tap.selection)
      return
    }
    const r = attemptPuzzleMove(puzzle, state, tap.from, tap.to)
    if (r.kind === 'promotion') {
      setPromoting({ from: tap.from, to: tap.to })
      return
    }
    applyAttempt(r)
  }

  const choosePromotion = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (!promoting) return
    const r = attemptPuzzleMove(puzzle, state, promoting.from, promoting.to, piece)
    setPromoting(null)
    applyAttempt(r)
  }

  const onHint = () => {
    if (state.status !== 'playing') return
    setState(requestHint(state))
    say('hintUsed', 'happy')
  }

  const restart = () => {
    setStartedAt(Date.now())
    setAttempt((n) => n + 1)
    setState(startPuzzle(puzzle))
    setSelection(NO_SELECTION)
    setPromoting(null)
    setViewing(false)
    setStep(0)
    setAutoPlay(false)
    setLine({ text: '', mood: 'idle' })
  }

  const goNext = async () => {
    const solved = await solvedPuzzleIds()
    if (state.status === 'solved') solved.add(puzzle.id)
    const pool = await loadFiltered(filter)
    const next = pickNextPuzzle(pool, solved, puzzle)
    if (next) navigate(`/puzzle/${next.id}?level=${filter}`)
    else setFinished(true)
  }

  const openSolution = () => {
    setViewing(true)
    setStep(0)
    setAutoPlay(true)
  }

  // Pieces and last move for the viewer, rebuilt from the solution so piece identities animate.
  const solutionPieces = useMemo(
    () =>
      piecesFromMoves(
        puzzle.fen,
        puzzle.moves.slice(0, step).map((uci) => ({
          from: uci.slice(0, 2) as Square,
          to: uci.slice(2, 4) as Square,
          promotion: uci[4] as PieceSymbol | undefined,
        })),
      ),
    [puzzle, step],
  )

  const shownFen = viewing ? (step === 0 ? puzzle.fen : steps[step - 1].fen) : state.fen
  const lastStep = viewing && step > 0 ? steps[step - 1] : null
  const view: BoardView = {
    pieces: viewing ? solutionPieces : state.pieces,
    selected: viewing ? null : selection.selected,
    legalTargets: viewing ? [] : selection.legalTargets,
    lastMove: viewing ? (lastStep ? { from: lastStep.from, to: lastStep.to } : null) : state.lastMove,
    checkSquare: checkSquareOf(shownFen),
    hint: viewing ? null : hintSquares(puzzle, state),
    pendingPromotion: viewing ? null : promoting,
    promotionColor: state.playerColor,
    selectSquare: viewing ? () => {} : onSquare,
    choosePromotion,
    cancelPromotion: () => setPromoting(null),
  }

  const opponentTurn = state.status === 'opponent'
  const finishedAttempt = state.status === 'solved' || state.status === 'failed'
  const mood: Mood = opponentTurn ? 'think' : line.mood
  const text = opponentTurn ? 'Let me think...' : line.text
  const playing = autoPlay && step < steps.length

  if (finished) {
    return (
      <main className="flex flex-1 flex-col items-center gap-4 px-6 pt-10 text-center">
        <h1 className="text-xl font-bold text-text-primary">Every puzzle here is solved</h1>
        <p className="text-sm text-text-secondary">Try another difficulty, or come back for new ones later.</p>
        <Button asChild variant="outline">
          <Link to={`/puzzles?level=${filter}`}>Back to puzzles</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-4">
      <header className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link to={`/puzzles?level=${filter}`} aria-label="Back to puzzles">
            <ArrowLeft strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="flex-1 truncate text-center text-base font-semibold text-text-primary">
          {puzzleThemeLabel(puzzle)}
        </h1>
        <span className="w-10" aria-hidden="true" />
      </header>

      <section className="flex items-start gap-3" aria-label="Opponent">
        <div className="relative size-14 shrink-0 rounded-2xl border border-border bg-surface-2 p-1">
          <OpponentAvatar opponent={opponent.id} mood={mood} className="h-full w-full" />
        </div>
        <div className="min-h-14 flex-1 rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2.5">
          <p className="text-sm text-text-primary" aria-live="polite">
            {viewing ? 'Watch the solution. Step through it at your pace.' : text}
          </p>
        </div>
      </section>

      <BoardSurface
        view={view}
        flipped={state.playerColor === 'b'}
        locked={viewing || state.status !== 'playing'}
        arrows={
          lastStep
            ? [
                {
                  from: lastStep.from,
                  to: lastStep.to,
                  color: lastStep.by === 'player' ? MOVE_ARROW_PLAYER : MOVE_ARROW_OPPONENT,
                },
              ]
            : []
        }
        label={`Puzzle ${puzzle.id} board`}
      />

      <section
        className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
        aria-label="Puzzle information"
      >
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-text-primary">{puzzleThemeLabel(puzzle)}</span>
          <span className="text-xs text-text-secondary">
            Rating {puzzle.rating} · {LEVEL_LABEL[puzzle.level]}
          </span>
        </div>
        <span className="text-xs text-text-secondary">
          {state.playerColor === 'w' ? 'You play White' : 'You play Black'}
        </span>
      </section>

      {viewing ? (
        <SolutionViewer
          steps={steps}
          step={step}
          playing={playing}
          onStep={setStep}
          onTogglePlay={() => {
            if (playing) setAutoPlay(false)
            else {
              if (step >= steps.length) setStep(0)
              setAutoPlay(true)
            }
          }}
          onClose={() => {
            setViewing(false)
            setAutoPlay(false)
          }}
        />
      ) : finishedAttempt ? (
        <ResultCard
          status={state.status}
          bestSan={bestSan}
          wrongSan={wrongSan}
          onNext={goNext}
          onRetry={restart}
          onSolution={openSolution}
          onHome={() => navigate('/home')}
        />
      ) : (
        <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <Button variant="outline" size="icon" onClick={restart} aria-label="Restart puzzle">
            <RotateCcw strokeWidth={1.8} aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            onClick={onHint}
            disabled={state.status !== 'playing' || state.hintLevel === 2}
          >
            <Lightbulb strokeWidth={1.8} aria-hidden="true" />
            {state.hintLevel === 1 ? 'Show square' : 'Hint'}
          </Button>
          <Button variant="outline" onClick={goNext}>
            <SkipForward strokeWidth={1.8} aria-hidden="true" />
            Skip
          </Button>
        </div>
      )}
    </main>
  )
}

/** Card under the board once an attempt ends: win, loss, and their next actions. */
function ResultCard({
  status,
  bestSan,
  wrongSan,
  onNext,
  onRetry,
  onSolution,
  onHome,
}: {
  status: PuzzleStatus
  bestSan: string
  wrongSan: string | null
  onNext: () => void
  onRetry: () => void
  onSolution: () => void
  onHome: () => void
}) {
  const solved = status === 'solved'
  const Icon = solved ? CircleCheck : CircleX
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4" aria-label="Result">
      <div className="flex items-start gap-3">
        <Icon
          className={cn('size-6 shrink-0', solved ? 'text-mint' : 'text-coral')}
          strokeWidth={2}
          aria-hidden="true"
        />
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-text-primary">{solved ? 'Solved!' : 'Not quite'}</h2>
          <p className="text-sm text-text-secondary">
            {solved
              ? `Best move: ${bestSan}. You found the whole line.`
              : `You played ${wrongSan ?? 'a different move'}. The best move was ${bestSan}.`}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {solved ? (
          <Button size="lg" onClick={onNext}>
            Next puzzle
          </Button>
        ) : (
          <Button size="lg" onClick={onRetry}>
            <RotateCcw strokeWidth={1.8} aria-hidden="true" />
            Try again
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onSolution}>
            View solution
          </Button>
          <Button variant="ghost" onClick={onHome}>
            <House strokeWidth={1.8} aria-hidden="true" />
            Home
          </Button>
        </div>
      </div>
    </section>
  )
}

/** Steps through the full solution with previous, next, and auto-play, and lists each move. */
function SolutionViewer({
  steps,
  step,
  playing,
  onStep,
  onTogglePlay,
  onClose,
}: {
  steps: { san: string; by: 'player' | 'opponent' }[]
  step: number
  playing: boolean
  onStep: (n: number) => void
  onTogglePlay: () => void
  onClose: () => void
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4" aria-label="Solution">
      <ol className="flex flex-wrap gap-1.5 text-sm" aria-label="Moves">
        {steps.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onStep(i + 1)}
              aria-current={step === i + 1 ? 'step' : undefined}
              className={cn(
                'rounded-md px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                step === i + 1 ? 'bg-primary font-semibold text-primary-foreground' : 'text-text-secondary',
                s.by === 'player' && step !== i + 1 && 'text-text-primary',
              )}
            >
              {s.by === 'player' ? '' : '… '}
              {s.san}
            </button>
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" onClick={() => onStep(Math.max(0, step - 1))} disabled={step === 0} aria-label="Previous move">
          <ChevronLeft strokeWidth={1.8} aria-hidden="true" />
        </Button>
        <Button variant="outline" onClick={onTogglePlay}>
          {playing ? <Pause strokeWidth={1.8} aria-hidden="true" /> : <Play strokeWidth={1.8} aria-hidden="true" />}
          {playing ? 'Pause' : 'Play'}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onStep(Math.min(steps.length, step + 1))}
          disabled={step >= steps.length}
          aria-label="Next move"
        >
          <ChevronRight strokeWidth={1.8} aria-hidden="true" />
        </Button>
      </div>
      <Button variant="outline" onClick={onClose}>
        Back to result
      </Button>
    </section>
  )
}
