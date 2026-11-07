import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Pause, Play, RefreshCw, Play as PlayIcon } from 'lucide-react'
import type { PieceSymbol, Square } from 'chess.js'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Chessboard, type BoardArrow } from '@/components/chess/chessboard'
import { EvalGraph, type GraphPoint } from '@/components/chess/eval-graph'
import { Button } from '@/components/ui/button'
import { engine } from '@/engine/engine-service'
import { cn } from '@/lib/utils'
import { AnalysisCancelled, analyzeRecord, positionsFor, type Evaluation } from '@/logic/analyze-game'
import { pieceSnapshotsFromMoves } from '@/logic/board-pieces'
import type { GameRecord } from '@/logic/game-record'
import { OPPONENTS } from '@/logic/opponents'
import { criticalMoments, plyLabel } from '@/logic/review'
import { getGame, saveGame } from '@/storage/games'
import { useGameStore } from '@/store/game-store'

const RESULT = { win: 'Win', loss: 'Loss', draw: 'Draw' } as const
const DIFFICULTY = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const
const HIGHLIGHT = '#FFB070'

/** Tint for the squares of the last move played. */
function lastMoveHighlights(from: string, to: string): Partial<Record<Square, string>> {
  return { [from]: HIGHLIGHT, [to]: HIGHLIGHT } as Partial<Record<Square, string>>
}

export default function Review() {
  const { gameId = '' } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState<GameRecord | null>(null)
  const [missing, setMissing] = useState(false)
  const [index, setIndex] = useState(0)
  // Side at the bottom. Starts on the player's side, and Flip switches it.
  const [bottomSide, setBottomSide] = useState<'w' | 'b' | null>(null)
  const [playing, setPlaying] = useState(false)
  const [arrowPly, setArrowPly] = useState<number | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [controller, setController] = useState<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    getGame(gameId).then((g) => {
      if (cancelled) return
      if (g) setRecord(g)
      else setMissing(true)
    })
    return () => {
      cancelled = true
    }
  }, [gameId])

  const positions = useMemo(() => (record ? positionsFor(record.startFen, record.moves) : []), [record])
  const pieceSnapshots = useMemo(() => {
    if (!record) return []
    const convertedMoves = record.moves.map((m) => ({
      from: m.uci.slice(0, 2) as Square,
      to: m.uci.slice(2, 4) as Square,
      promotion: m.uci[4] ? (m.uci[4] as PieceSymbol) : undefined,
    }))
    return pieceSnapshotsFromMoves(record.startFen, convertedMoves)
  }, [record])
  const total = record?.moves.length ?? 0
  const orientation: 'w' | 'b' = bottomSide ?? record?.playerColor ?? 'w'

  // Auto-play one move per second until the end.
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setIndex((i) => {
        if (i >= total) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [playing, total])

  // Arrow keys step through the moves. Home and End jump to the ends.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(total, i + 1))
      else if (e.key === 'Home') setIndex(0)
      else if (e.key === 'End') setIndex(total)
      else return
      setArrowPly(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total])

  if (missing) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-bold text-text-primary">Game not found</h1>
        <p className="text-sm text-text-secondary">It may have been deleted. Your other games are still in Profile.</p>
        <Button variant="outline" onClick={() => navigate('/profile')}>
          Back to Profile
        </Button>
      </main>
    )
  }
  if (!record) return <main className="flex flex-1 items-center justify-center text-sm text-text-secondary">Loading...</main>

  const moves = record.moves
  const last = index > 0 ? moves[index - 1] : null
  const lastFrom = last ? last.uci.slice(0, 2) : ''
  const lastTo = last ? last.uci.slice(2, 4) : ''
  const critical = criticalMoments(record, positions)
  const arrows: BoardArrow[] =
    arrowPly !== null && index === arrowPly && critical.find((c) => c.ply === arrowPly)?.bestUci
      ? [
          {
            from: critical.find((c) => c.ply === arrowPly)!.bestUci!.slice(0, 2) as BoardArrow['from'],
            to: critical.find((c) => c.ply === arrowPly)!.bestUci!.slice(2, 4) as BoardArrow['to'],
            color: '#29A879',
          },
        ]
      : []

  const graphPoints: GraphPoint[] = [
    { index: 0, win: 50 },
    ...moves.map((m, i) => ({ index: i + 1, win: m.winAfter ?? NaN, grade: m.by === 'player' ? m.grade : undefined })),
  ].filter((p) => !Number.isNaN(p.win))

  const counts = record.gradeCounts

  const jump = (i: number, arrowFor: number | null = null) => {
    setPlaying(false)
    setIndex(Math.max(0, Math.min(total, i)))
    setArrowPly(arrowFor)
  }

  const analyze = async () => {
    const ctrl = new AbortController()
    setController(ctrl)
    setProgress({ done: 0, total: 1 })
    try {
      const evaluate = async (fen: string): Promise<Evaluation> => {
        const r = await engine.analyze(fen, 250)
        return { cp: r.cp, mate: r.mate, best: r.best }
      }
      const updated = await analyzeRecord(record, evaluate, {
        signal: ctrl.signal,
        onProgress: (done, t) => setProgress({ done, total: t }),
      })
      await saveGame(updated)
      setRecord(updated)
      toast.success('Analysis saved')
    } catch (err) {
      if (err instanceof AnalysisCancelled) toast('Analysis cancelled')
      else toast.error('Analysis failed. Check the engine and try again.')
    } finally {
      setProgress(null)
      setController(null)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-8">
      <header className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/profile'))} aria-label="Back">
          <ArrowLeft strokeWidth={1.8} aria-hidden="true" />
        </Button>
        <div className="flex min-w-0 flex-col">
          <h1 className="text-lg font-bold text-text-primary">Game review</h1>
          <p className="truncate text-xs text-text-secondary">
            vs {OPPONENTS[record.opponent].name} ({DIFFICULTY[record.difficulty]}) · {RESULT[record.result]}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-4 gap-2 rounded-2xl border border-border bg-card p-3 text-center" aria-label="Summary">
        <Stat label="Accuracy" value={record.accuracy} />
        <Stat label="Best" value={counts.best} />
        <Stat label="Mistakes" value={counts.mistake} />
        <Stat label="Blunders" value={counts.blunder} />
      </section>

      {!record.analyzed && (
        <section className="flex flex-col gap-2 rounded-2xl border border-dashed border-border p-4">
          <p className="text-sm text-text-secondary">
            This game was saved without full analysis. Analyze it to see grades and the win chance graph.
          </p>
          {progress ? (
            <div className="flex flex-col gap-2">
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={progress.total}
                aria-valuenow={progress.done}
                aria-label="Analysis progress"
              >
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
                />
              </div>
              <Button variant="outline" onClick={() => controller?.abort()}>
                Cancel analysis
              </Button>
            </div>
          ) : (
            <Button onClick={() => void analyze()}>
              <RefreshCw strokeWidth={1.8} aria-hidden="true" />
              Analyze game
            </Button>
          )}
        </section>
      )}

      <Chessboard
        fen={positions[index]}
        pieces={pieceSnapshots[index]}
        readOnly
        orientation={orientation}
        highlights={last ? lastMoveHighlights(lastFrom, lastTo) : undefined}
        arrows={arrows}
      />

      <nav className="flex items-center justify-between gap-2" aria-label="Move steps">
        <Button variant="outline" size="icon" onClick={() => jump(0)} disabled={index === 0} aria-label="First move">
          <ChevronFirst strokeWidth={1.8} aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => jump(index - 1)} disabled={index === 0} aria-label="Previous move">
          <ChevronLeft strokeWidth={1.8} aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPlaying((p) => !p)}
          disabled={total === 0}
          aria-label={playing ? 'Pause' : 'Play through the moves'}
        >
          {playing ? <Pause strokeWidth={1.8} aria-hidden="true" /> : <Play strokeWidth={1.8} aria-hidden="true" />}
        </Button>
        <Button variant="outline" size="icon" onClick={() => jump(index + 1)} disabled={index === total} aria-label="Next move">
          <ChevronRight strokeWidth={1.8} aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => jump(total)} disabled={index === total} aria-label="Last move">
          <ChevronLast strokeWidth={1.8} aria-hidden="true" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setBottomSide(orientation === 'w' ? 'b' : 'w')}>
          Flip
        </Button>
      </nav>
      <p className="text-center text-xs text-text-secondary">
        Move {index} of {total}. Use the arrow keys to step through.
      </p>

      <section className="flex flex-col gap-2" aria-label="Win chance graph">
        <h2 className="text-sm font-semibold text-text-secondary">Win chance</h2>
        <EvalGraph points={graphPoints} current={index} onSelect={(i) => jump(i)} />
      </section>

      <section className="flex flex-col gap-2" aria-label="Moves">
        <h2 className="text-sm font-semibold text-text-secondary">Moves</h2>
        <ol className="grid grid-cols-2 gap-1 text-sm">
          {moves.map((m, k) => (
            <li key={k}>
              <button
                type="button"
                onClick={() => jump(k + 1)}
                aria-current={index === k + 1 ? 'step' : undefined}
                className={cn(
                  'w-full rounded-lg px-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  index === k + 1 ? 'bg-primary/15 text-primary' : 'text-text-primary hover:bg-surface-2',
                )}
              >
                <span className="text-text-secondary">{Math.floor(k / 2) + 1}{m.by === 'player' ? '.' : '...'}</span>{' '}
                {plyLabel(m)}
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-2" aria-label="Critical moments">
        <h2 className="text-sm font-semibold text-text-secondary">Critical moments</h2>
        {critical.length === 0 ? (
          <p className="text-sm text-text-secondary">No big mistakes in this game.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {critical.map((c) => (
              <li key={c.ply}>
                <button
                  type="button"
                  onClick={() => jump(c.ply, c.ply)}
                  className="flex w-full flex-col gap-1 rounded-2xl border border-border bg-card p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-sm font-semibold text-text-primary">
                    Move {Math.floor(c.ply / 2) + 1}: you played {moves[c.ply].san}, win chance dropped {c.drop} points
                  </span>
                  {c.bestSan && (
                    <span className="text-xs text-text-secondary">
                      Better: {c.bestSan}
                      {c.reason ? `. ${c.reason}.` : '.'}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text-secondary">Next</h2>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => {
            // Start a new game from the current position
            const positionFen = positions[index]
            useGameStore.getState().newGameFromFen(positionFen, record.difficulty, record.playerColor)
            navigate('/play')
          }}
        >
          <PlayIcon className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Play from this position
        </Button>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-bold text-text-primary">{value}</span>
      <span className="text-[11px] text-text-secondary">{label}</span>
    </div>
  )
}
