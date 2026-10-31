import { useEffect, useState } from 'react'
import { BookOpen, ChartNoAxesColumnIncreasing, Flame, Puzzle, Settings2, Play, RotateCcw } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { ConfirmDialog } from '@/components/layout/confirm-dialog'
import { NewGameSheet } from '@/components/chess/new-game-sheet'
import { StatRing } from '@/components/profile/stat-ring'
import { Button } from '@/components/ui/button'
import { dateKey } from '@/logic/activity'
import type { Color } from 'chess.js'
import { OPPONENTS, opponentForTheme } from '@/logic/opponents'
import { computeStats, type ProfileStats } from '@/logic/stats'
import type { Difficulty } from '@/logic/types'
import { listGames } from '@/storage/games'
import { getActivityDays } from '@/storage/activity'
import { getDisplayName } from '@/storage/profile'
import { loadBattle } from '@/storage/battle-storage'
import { isActivePhase, useGameStore } from '@/store/game-store'
import { useSettingsStore } from '@/store/settings-store'
import { resolveTheme } from '@/store/theme'

/** Morning, afternoon, or evening, from the device clock. */
function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Card with a title, a short line of text, and a call to action. Used for the feature shortcuts. */
function ShortcutCard({
  to,
  icon: Icon,
  title,
  text,
  cta,
}: {
  to: string
  icon: typeof Puzzle
  title: string
  text: string
  cta: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        <span className="truncate text-xs text-text-secondary">{text}</span>
      </span>
      <span className="text-xs font-medium text-primary">{cta}</span>
    </Link>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const battleActive = useGameStore((st) => isActivePhase(st.phase))
  const settingsTheme = useSettingsStore((st) => st.theme)
  const opponentName = OPPONENTS[opponentForTheme(resolveTheme(settingsTheme))].name

  const [name, setName] = useState('Player')
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [latestGameId, setLatestGameId] = useState<string | null>(null)
  const [hasSavedBattle, setHasSavedBattle] = useState(false)
  const [newGameOpen, setNewGameOpen] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState<{ difficulty: Difficulty; color: Color } | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getDisplayName(), listGames(), getActivityDays(), loadBattle()]).then(([n, games, days, battle]) => {
      if (cancelled) return
      setName(n)
      setStats(computeStats(games, days, dateKey(Date.now())))
      setLatestGameId(games[0]?.id ?? null)
      setHasSavedBattle(battle !== null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const startGame = (difficulty: Difficulty, color: Color) => {
    useGameStore.getState().newGame(difficulty, color)
    navigate('/play')
  }

  const onPlay = (difficulty: Difficulty, color: Color) => {
    setNewGameOpen(false)
    // Starting a new game replaces the saved battle, so ask first.
    if (hasSavedBattle || battleActive) setConfirmReplace({ difficulty, color })
    else startGame(difficulty, color)
  }

  const hasBattle = battleActive || hasSavedBattle
  const firstName = name.split(' ')[0]

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 pt-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm text-text-secondary">{greeting(new Date().getHours())},</span>
          <h1 className="truncate text-2xl font-bold text-text-primary">{firstName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 rounded-full bg-yellow/25 px-3 py-1.5 text-sm font-semibold text-text-primary"
            aria-label={`Day streak: ${stats?.currentDayStreak ?? 0}`}
          >
            <Flame className="size-4 text-primary" strokeWidth={1.8} aria-hidden="true" />
            {stats?.currentDayStreak ?? 0}
          </span>
          <Button asChild variant="ghost" size="icon" aria-label="Settings">
            <Link to="/settings">
              <Settings2 strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5" aria-label="Play">
        {hasBattle ? (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-text-primary">Resume battle</h2>
              <p className="text-sm text-text-secondary">Pick up where you left off against the {opponentName.toLowerCase()}.</p>
            </div>
            <Button size="lg" onClick={() => navigate('/play')}>
              <RotateCcw strokeWidth={1.8} aria-hidden="true" />
              Resume battle
            </Button>
            <Button variant="outline" size="lg" onClick={() => setNewGameOpen(true)}>
              New game
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-text-primary">Play vs {opponentName.toLowerCase()}</h2>
              <p className="text-sm text-text-secondary">Choose a level and your color, then start.</p>
            </div>
            <Button size="lg" onClick={() => setNewGameOpen(true)}>
              <Play strokeWidth={1.8} aria-hidden="true" />
              New game
            </Button>
          </>
        )}
      </section>

      <div className="flex flex-col gap-3">
        <ShortcutCard to="/puzzles" icon={Puzzle} title="Puzzles" text="Pick a puzzle" cta="Open" />
        <ShortcutCard to="/learn" icon={BookOpen} title="Learn" text="Start learning" cta="Open" />
        {latestGameId ? (
          <ShortcutCard
            to={`/review/${latestGameId}`}
            icon={ChartNoAxesColumnIncreasing}
            title="Analysis"
            text="Review your latest game"
            cta="Review"
          />
        ) : (
          <ShortcutCard
            to="/profile"
            icon={ChartNoAxesColumnIncreasing}
            title="Analysis"
            text="Finish a game to review it"
            cta="Open"
          />
        )}
      </div>

      <section className="flex flex-col gap-3" aria-label="Recent progress">
        <h2 className="text-sm font-semibold text-text-secondary">Recent progress</h2>
        {stats && stats.record.total > 0 ? (
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <StatRing percent={stats.winRate} label="Win rate" />
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-text-primary">Win rate</span>
              <span className="text-text-secondary">
                {stats.record.wins} wins, {stats.record.losses} losses, {stats.record.draws} draws
              </span>
              <span className="text-text-secondary">Puzzles solved: 0</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-secondary">
            Your results will show here after your first finished game.
          </div>
        )}
      </section>

      <NewGameSheet open={newGameOpen} onOpenChange={setNewGameOpen} onPlay={onPlay} />
      <ConfirmDialog
        open={confirmReplace !== null}
        onOpenChange={(o) => !o && setConfirmReplace(null)}
        title="Replace your battle?"
        description="The game in progress will be deleted and a new one will start."
        confirmLabel="New game"
        destructive
        onConfirm={() => confirmReplace && startGame(confirmReplace.difficulty, confirmReplace.color)}
      />
    </main>
  )
}
