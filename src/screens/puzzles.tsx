import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, CircleCheck, Puzzle, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { MiniBoard } from '@/components/chess/mini-board'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { playerColorOf, displayFen } from '@/logic/puzzle-flow'
import {
  LEVEL_LABEL,
  PUZZLE_LEVELS,
  loadFiltered,
  puzzleThemeLabel,
  themeLabel,
  type PuzzleEntry,
  type PuzzleFilter,
} from '@/logic/puzzle-library'
import { solvedPuzzleIds } from '@/storage/puzzles'

const PAGE_SIZE = 20

const LEVEL_BADGE: Record<PuzzleEntry['level'], string> = {
  easy: 'border-mint text-mint',
  medium: 'border-yellow text-yellow',
  hard: 'border-coral text-coral',
}

function parseFilter(v: string | null): PuzzleFilter {
  return v === 'easy' || v === 'medium' || v === 'hard' ? v : 'all'
}

/** One puzzle row: thumbnail, theme title, difficulty, and solved state. */
function PuzzleRow({ puzzle, solved, to }: { puzzle: PuzzleEntry; solved: boolean; to: string }) {
  const shown = useMemo(() => displayFen(puzzle), [puzzle])
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Puzzle ${puzzle.id}, ${puzzleThemeLabel(puzzle)}, ${LEVEL_LABEL[puzzle.level]}${solved ? ', solved' : ''}`}
      >
        <MiniBoard fen={shown} orientation={playerColorOf(puzzle.fen)} className="w-16 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate text-lg font-semibold text-text-primary">{puzzleThemeLabel(puzzle)}</span>
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('bg-transparent', LEVEL_BADGE[puzzle.level])}>
              {LEVEL_LABEL[puzzle.level]}
            </Badge>
            {solved && (
              <span className="flex items-center gap-1 text-xs font-medium text-mint">
                <CircleCheck className="size-3.5" strokeWidth={2} aria-hidden="true" />
                Solved
              </span>
            )}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-text-secondary" strokeWidth={1.8} aria-hidden="true" />
      </Link>
    </li>
  )
}

export default function Puzzles() {
  const [params, setParams] = useSearchParams()
  const filter = parseFilter(params.get('level'))
  const theme = params.get('theme')
  const [unsolvedOnly, setUnsolvedOnly] = useState(false)
  const [items, setItems] = useState<PuzzleEntry[] | null>(null)
  const [solved, setSolved] = useState<Set<string>>(new Set())
  const [shown, setShown] = useState(PAGE_SIZE)

  useEffect(() => {
    let cancelled = false
    void loadFiltered(filter).then((list) => {
      if (!cancelled) setItems(list)
    })
    void solvedPuzzleIds().then((ids) => {
      if (!cancelled) setSolved(ids)
    })
    return () => {
      cancelled = true
    }
  }, [filter])

  const filtered = useMemo(() => {
    if (!items) return []
    return items.filter((p) => {
      if (theme && !p.themes.includes(theme)) return false
      if (unsolvedOnly && solved.has(p.id)) return false
      return true
    })
  }, [items, theme, unsolvedOnly, solved])

  const setLevel = (level: PuzzleFilter) => {
    const next = new URLSearchParams(params)
    if (level === 'all') next.delete('level')
    else next.set('level', level)
    setParams(next, { replace: true })
    setShown(PAGE_SIZE)
  }

  const linkFor = (id: string) => `/puzzle/${id}?level=${filter}`
  const page = filtered.slice(0, shown)

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-4">
      <header className="flex items-center gap-2">
        <Puzzle className="size-6 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <h1 className="text-xl font-bold text-text-primary">Puzzles</h1>
      </header>

      <div className="flex items-center justify-between gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-between gap-2">
              <span>
                Difficulty: <span className="font-semibold">{filter === 'all' ? 'All' : LEVEL_LABEL[filter]}</span>
              </span>
              <ChevronDown className="size-4" strokeWidth={1.8} aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setLevel(parseFilter(v))}>
              <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
              {PUZZLE_LEVELS.map((l) => (
                <DropdownMenuRadioItem key={l} value={l}>
                  {LEVEL_LABEL[l]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <label htmlFor="unsolved-only" className="text-sm text-text-secondary">
            Unsolved only
          </label>
          <Switch id="unsolved-only" checked={unsolvedOnly} onCheckedChange={setUnsolvedOnly} />
        </div>
      </div>

      {theme && (
        <div>
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params)
              next.delete('theme')
              setParams(next, { replace: true })
            }}
            aria-label={`Remove theme filter: ${themeLabel(theme)}`}
            className="flex h-9 items-center gap-1 rounded-full border border-primary px-3 text-sm font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {themeLabel(theme)}
            <X className="size-4" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      )}

      {items === null ? (
        <p className="text-sm text-text-secondary">Loading puzzles...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-secondary">
          {unsolvedOnly && items.length > 0
            ? 'All puzzles in this category are solved. Turn off "Unsolved only" to see them.'
            : 'No puzzles match this filter.'}
        </div>
      ) : (
        <>
          <p className="text-xs text-text-secondary" aria-live="polite">
            Showing {page.length} of {filtered.length}
          </p>
          <ul className="flex flex-col gap-3">
            {page.map((p) => (
              <PuzzleRow key={p.id} puzzle={p} solved={solved.has(p.id)} to={linkFor(p.id)} />
            ))}
          </ul>
          {shown < filtered.length && (
            <Button variant="outline" size="lg" onClick={() => setShown((n) => n + PAGE_SIZE)}>
              Load more
            </Button>
          )}
        </>
      )}
    </main>
  )
}
