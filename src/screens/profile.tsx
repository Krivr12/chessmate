import { useEffect, useRef, useState } from 'react'
import {
  Brain,
  CalendarCheck,
  Flame,
  GraduationCap,
  Puzzle,
  Settings2,
  ShieldCheck,
  Swords,
  Target,
  Trash2,
  Trophy,
  Undo2,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { OpponentAvatar } from '@/components/opponent/opponent-avatar'
import { ConfirmDialog } from '@/components/layout/confirm-dialog'
import { StatRing } from '@/components/profile/stat-ring'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { dateKey } from '@/logic/activity'
import { BADGES, earnedBadges, type BadgeId, type ExtraProgress } from '@/logic/badges'
import type { GameRecord } from '@/logic/game-record'
import { opponentForTheme } from '@/logic/opponents'
import { computeStats, type ProfileStats } from '@/logic/stats'
import { cn } from '@/lib/utils'
import { resolveTheme } from '@/store/theme'
import { useSettingsStore } from '@/store/settings-store'
import { getActivityDays } from '@/storage/activity'
import { deleteGame, listGames } from '@/storage/games'
import { getDisplayName, getSeenBadges, MAX_NAME_LENGTH, setDisplayName, setSeenBadges } from '@/storage/profile'
import { getExtraProgress } from '@/storage/progress'

type Filter = 'all' | 'wins' | 'losses' | 'draws'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'wins', label: 'Wins' },
  { value: 'losses', label: 'Losses' },
  { value: 'draws', label: 'Draws' },
]
const RESULT_LABEL = { win: 'Win', loss: 'Loss', draw: 'Draw' } as const
const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const
const HISTORY_PAGE_SIZE = 5

const BADGE_ICON: Record<BadgeId, LucideIcon> = {
  'first-win': Trophy,
  'getting-started': Zap,
  'giant-slayer': Swords,
  'clean-game': ShieldCheck,
  comeback: Undo2,
  'quick-mate': Target,
  'streak-3': Flame,
  'streak-7': CalendarCheck,
  'puzzle-starter': Puzzle,
  'puzzle-pro': Brain,
  graduate: GraduationCap,
}

/** Round medal with the badge icon. Orange when unlocked, muted when locked. */
function Medal({ icon: Icon, unlocked }: { icon: LucideIcon; unlocked: boolean }) {
  return (
    <span
      className={cn(
        'flex size-16 shrink-0 items-center justify-center rounded-full border-2',
        unlocked ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-surface-2 text-text-secondary',
      )}
      aria-hidden="true"
    >
      <Icon className="size-8" strokeWidth={1.8} />
    </span>
  )
}

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

/** Recent accuracy as bars. Each bar is a button that opens that game's review. */
function RecentBars({ games }: { games: GameRecord[] }) {
  const navigate = useNavigate()
  if (games.length === 0) return <p className="text-sm text-text-secondary">No games yet.</p>
  return (
    <ul className="flex h-29 items-end gap-2" aria-label="Accuracy of your last games">
      {games.map((g) => (
        <li key={g.id} className="flex h-full flex-1 flex-col justify-end">
          <button
            type="button"
            onClick={() => navigate(`/review/${g.id}`)}
            className="flex w-full flex-col items-center justify-end gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${formatDate(g.endedAt)}: accuracy ${g.accuracy}. Open review.`}
          >
            <span className="text-[10px] font-semibold text-text-secondary">{g.accuracy}</span>
            <span
              className="w-full rounded-t-md bg-primary"
              style={{ height: `${Math.max(4, g.accuracy) * 1.2}px` }}
            />
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const settingsTheme = useSettingsStore((st) => st.theme)
  const opponent = opponentForTheme(resolveTheme(settingsTheme))

  const [name, setName] = useState('Player')
  const [games, setGames] = useState<GameRecord[]>([])
  const [days, setDays] = useState<string[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(0)
  const [selectedBadge, setSelectedBadge] = useState<BadgeId | null>(null)
  const [toDelete, setToDelete] = useState<GameRecord | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [today, setToday] = useState('')
  const [extra, setExtra] = useState<ExtraProgress>({ puzzlesSolved: 0, learnTracksDone: 0 })
  const nameInput = useRef<HTMLInputElement>(null)

  const reload = () =>
    Promise.all([listGames(), getActivityDays()]).then(([g, d]) => {
      setGames(g)
      setDays(d)
    })

  useEffect(() => {
    let cancelled = false
    Promise.all([getDisplayName(), listGames(), getActivityDays(), getSeenBadges(), getExtraProgress()]).then(
      async ([n, g, d, seen, x]) => {
        if (cancelled) return
        setName(n)
        setGames(g)
        setDays(d)
        setExtra(x)
        setToday(dateKey(Date.now()))
        setLoaded(true)
        // Tell the player about badges they just earned, once each.
        const now = earnedBadges(g, d, x)
        const fresh = [...now].filter((id) => !seen.includes(id))
        if (fresh.length > 0) {
          for (const id of fresh) {
            const badge = BADGES.find((b) => b.id === id)
            if (badge) toast.success(`Badge unlocked: ${badge.name}`)
          }
          await setSeenBadges([...seen, ...fresh])
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  const stats: ProfileStats = computeStats(games, days, today)
  const earned = earnedBadges(games, days, extra) as Set<BadgeId>
  const shown = games.filter((g) => {
    if (filter === 'wins') return g.result === 'win'
    if (filter === 'losses') return g.result === 'loss'
    if (filter === 'draws') return g.result === 'draw'
    return true
  })
  const pageCount = Math.max(1, Math.ceil(shown.length / HISTORY_PAGE_SIZE))
  // Clamp so the page stays valid after a delete removes the last row on the final page.
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = shown.slice(currentPage * HISTORY_PAGE_SIZE, (currentPage + 1) * HISTORY_PAGE_SIZE)

  const saveName = async () => {
    const value = nameInput.current?.value ?? ''
    const saved = await setDisplayName(value)
    setName(saved)
    if (nameInput.current) nameInput.current.value = saved
  }

  const removeGame = async () => {
    if (!toDelete) return
    try {
      await deleteGame(toDelete.id)
      toast.success('Game deleted')
      await reload()
    } catch {
      toast.error('Could not delete the game')
    }
    setToDelete(null)
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-10">
      <header className="flex items-center gap-3">
        <div className="size-14 shrink-0 rounded-2xl border border-border bg-surface-2 p-1">
          <OpponentAvatar opponent={opponent} mood="idle" className="h-full w-full" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <label htmlFor="display-name" className="text-xs text-text-secondary">
            Display name
          </label>
          <input
            id="display-name"
            ref={nameInput}
            key={name}
            defaultValue={name}
            maxLength={MAX_NAME_LENGTH}
            onBlur={() => void saveName()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            className="w-full rounded-lg border border-transparent bg-transparent text-lg font-bold text-text-primary outline-none focus:border-border focus:bg-card focus:px-2"
          />
        </div>
        <Button asChild variant="ghost" size="icon" aria-label="Settings">
          <Link to="/settings">
            <Settings2 strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </Button>
      </header>

      {loaded && games.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-secondary">
          No games yet. Finish a game and it will appear here with your stats.
        </div>
      )}

      <section className="grid grid-cols-2 gap-3" aria-label="Summary">
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3">
          <StatRing percent={stats.winRate} label="Win rate" size={140} />
          <span className="text-xs text-text-secondary">
            {stats.record.wins}W {stats.record.losses}L {stats.record.draws}D
          </span>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
          <div>
            <span className="block text-xs text-text-secondary">Day streak</span>
            <span className="font-bold text-text-primary">{stats.currentDayStreak} now, best {stats.bestDayStreak}</span>
          </div>
          <div>
            <span className="block text-xs text-text-secondary">Win streak</span>
            <span className="font-bold text-text-primary">Best {stats.bestWinStreak}</span>
          </div>
          <div>
            <span className="block text-xs text-text-secondary">Puzzles solved</span>
            <span className="font-bold text-text-primary">{extra.puzzlesSolved}</span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-label="Recent performance">
        <h2 className="text-sm font-semibold text-text-secondary">Recent performance</h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <RecentBars games={stats.recentGames} />
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-label="By difficulty">
        <h2 className="text-sm font-semibold text-text-secondary">By difficulty</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-secondary">
              <th className="px-4 py-2 font-medium">Level</th>
              <th className="px-2 py-2 font-medium">Wins</th>
              <th className="px-2 py-2 font-medium">Losses</th>
              <th className="px-2 py-2 font-medium">Draws</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(DIFFICULTY_LABEL) as (keyof typeof DIFFICULTY_LABEL)[]).map((d) => (
              <tr key={d} className="border-t border-border">
                <td className="px-4 py-2 text-text-primary">{DIFFICULTY_LABEL[d]}</td>
                <td className="px-2 py-2">{stats.record.byDifficulty[d].wins}</td>
                <td className="px-2 py-2">{stats.record.byDifficulty[d].losses}</td>
                <td className="px-2 py-2">{stats.record.byDifficulty[d].draws}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-label="History">
        <h2 className="text-sm font-semibold text-text-secondary">History</h2>
        <div role="group" aria-label="Filter games" className="flex gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? 'default' : 'outline'}
              aria-pressed={filter === f.value}
              onClick={() => {
                setFilter(f.value)
                setPage(0)
              }}
            >
              {f.label}
            </Button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="text-sm text-text-secondary">No games match this filter.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
            {pageRows.map((g) => (
              <li key={g.id} className="flex items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => navigate(`/review/${g.id}`)}
                  className="flex min-w-0 flex-1 flex-col items-start text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-sm font-semibold text-text-primary">
                    {RESULT_LABEL[g.result]} · {DIFFICULTY_LABEL[g.difficulty]}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {formatDate(g.endedAt)} · accuracy {g.accuracy}
                    {!g.analyzed && ' · not analyzed yet'}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete game from ${formatDate(g.endedAt)}`}
                  onClick={() => setToDelete(g)}
                >
                  <Trash2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {shown.length > HISTORY_PAGE_SIZE && (
          <nav aria-label="History pages" className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-text-secondary">
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </nav>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-label="Badges">
        <h2 className="text-sm font-semibold text-text-secondary">Badges</h2>
        <ul className="grid grid-cols-3 gap-2">
          {BADGES.map((b) => {
            const unlocked = earned.has(b.id)
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setSelectedBadge(b.id)}
                  aria-label={`${b.name}, ${unlocked ? 'unlocked' : 'locked'}`}
                  className="flex h-full w-full flex-col items-center gap-2 rounded-2xl p-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Medal icon={BADGE_ICON[b.id]} unlocked={unlocked} />
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      unlocked ? 'text-primary' : 'text-text-secondary',
                    )}
                  >
                    {b.name}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <Dialog open={selectedBadge !== null} onOpenChange={(o) => !o && setSelectedBadge(null)}>
        <DialogContent className="flex flex-col items-center gap-3 text-center">
          {selectedBadge && (() => {
            const badge = BADGES.find((b) => b.id === selectedBadge)
            if (!badge) return null
            const unlocked = earned.has(badge.id)
            return (
              <>
                <Medal icon={BADGE_ICON[badge.id]} unlocked={unlocked} />
                <DialogHeader className="items-center">
                  <DialogTitle>{badge.name}</DialogTitle>
                  <DialogDescription>{unlocked ? 'Unlocked' : 'Locked'}</DialogDescription>
                </DialogHeader>
                <p className="text-sm text-text-primary">Task: {badge.rule}</p>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this game?"
        description="This game's record and its analysis are removed. Your other stats update."
        confirmLabel="Delete game"
        destructive
        onConfirm={() => void removeGame()}
      />
    </main>
  )
}
