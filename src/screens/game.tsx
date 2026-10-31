import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { Chessboard } from '@/components/chess/chessboard'
import { HintCard } from '@/components/chess/hint-card'
import { HintSheet } from '@/components/chess/hint-sheet'
import { MoveCommentary } from '@/components/chess/move-commentary'
import { MoveToolbar } from '@/components/chess/move-toolbar'
import { NewGameSheet } from '@/components/chess/new-game-sheet'
import { CapturedPanel } from '@/components/chess/captured-panel'
import { WinChanceCard } from '@/components/chess/win-chance-card'
import { AppHeader } from '@/components/layout/app-header'
import { ConfirmDialog } from '@/components/layout/confirm-dialog'
import { ResultScreen } from '@/components/result/result-screen'
import { capturedFromMoves, materialBalance } from '@/logic/captured'
import { gameIdFor } from '@/logic/game-record'
import { DIFFICULTIES } from '@/logic/difficulty'
import { OPPONENTS } from '@/logic/opponents'
import { isActivePhase, useGameStore } from '@/store/game-store'
import { loadBattle } from '@/storage/battle-storage'
import { useSettingsStore } from '@/store/settings-store'
import { useThemeLock } from '@/store/theme-lock'

export default function Game() {
  const navigate = useNavigate()
  const s = useGameStore(
    useShallow((st) => ({
      phase: st.phase,
      difficulty: st.difficulty,
      opponent: st.opponent,
      startedAt: st.startedAt,
      startFen: st.startFen,
      playerColor: st.playerColor,
      moves: st.moves,
      redo: st.redo,
      winChance: st.winChance,
      trend: st.trend,
      hint: st.hint,
      hintLoading: st.hintLoading,
      outcome: st.outcome,
      fen: st.fen,
    })),
  )
  const actions = useGameStore.getState()
  const [hintOpen, setHintOpen] = useState(false)
  const [newGameOpen, setNewGameOpen] = useState(false)
  const [confirm, setConfirm] = useState<'reset' | 'resign' | null>(null)

  // Opening /play directly (or after a reload): resume the saved battle or start one.
  useEffect(() => {
    const store = useGameStore.getState()
    if (store.phase === 'idle') {
      let cancelled = false
      void loadBattle().then((saved) => {
        if (cancelled || useGameStore.getState().phase !== 'idle') return
        if (saved) store.resume(saved)
        else store.newGame(useSettingsStore.getState().defaultDifficulty)
      })
      return () => {
        cancelled = true
      }
    }
    store.continueGame()
    return () => {
      // A finished game no longer locks the theme once the player leaves the page (D2).
      if (useGameStore.getState().phase === 'over') useThemeLock.getState().unlock()
      useGameStore.getState().pause()
    }
  }, [])

  // Close the hint once the position changes.
  const [hintFen, setHintFen] = useState<string | null>(null)
  if (hintOpen && hintFen !== null && hintFen !== s.fen) {
    setHintOpen(false)
    setHintFen(null)
  }

  const isPlayerTurn = s.phase === 'player'
  const active = isActivePhase(s.phase)
  const hasPlayerMove = s.moves.some((m) => m.by === 'player')
  const cfg = DIFFICULTIES[s.difficulty]
  const showHints = useSettingsStore((st) => st.showHints)
  const opponent = OPPONENTS[s.opponent]
  // Derived from the move list and the board, so undo, redo and resume need no extra state.
  const captured = useMemo(
    () => capturedFromMoves(s.startFen, s.moves, s.playerColor),
    [s.startFen, s.moves, s.playerColor],
  )
  const advantage = useMemo(() => materialBalance(s.fen, s.playerColor), [s.fen, s.playerColor])

  const openHint = () => {
    setHintFen(s.fen)
    setHintOpen(true)
    void actions.requestHint()
  }
  const closeHint = () => {
    setHintOpen(false)
    setHintFen(null)
    actions.clearHint()
  }
  const playHint = () => {
    const h = useGameStore.getState().hint
    closeHint()
    if (h) actions.playerMove(h.from, h.to)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-4">
      <AppHeader
        title={`vs ${opponent.name} (${cfg.label})`}
        canResign={active}
        onNewGame={() => setNewGameOpen(true)}
        onResign={() => setConfirm('resign')}
      />
      <MoveCommentary />
      <Chessboard />
      <p className="sr-only" aria-live="polite">
        {s.phase === 'player'
          ? 'Your turn'
          : s.phase === 'opponent' || s.phase === 'grading'
            ? `${opponent.name} is thinking`
            : ''}
      </p>
      <MoveToolbar
        canUndo={active && hasPlayerMove}
        canRedo={isPlayerTurn && s.redo.length > 0}
        canReset={s.moves.length > 0 || s.phase === 'over'}
        onUndo={actions.undo}
        onRedo={actions.redoMove}
        onReset={() =>
          active && s.moves.length > 0 ? setConfirm('reset') : actions.newGame(s.difficulty, s.playerColor)
        }
      />
      <div className="grid grid-cols-2 gap-3 max-[340px]:grid-cols-1">
        <HintCard
          disabled={!isPlayerTurn || !showHints}
          reason={showHints ? undefined : 'Hints are off. Turn them on in Settings.'}
          onClick={openHint}
        />
        <WinChanceCard win={s.winChance} trend={s.trend} />
      </div>
      <CapturedPanel
        playerColor={s.playerColor}
        opponentName={opponent.name}
        summary={captured}
        advantage={advantage}
      />

      <HintSheet
        open={hintOpen}
        hint={s.hint}
        loading={s.hintLoading}
        onPlay={playHint}
        onDismiss={closeHint}
        opponentName={opponent.name}
      />
      <NewGameSheet
        open={newGameOpen}
        opponent={s.opponent}
        onOpenChange={setNewGameOpen}
        onPlay={(difficulty, color) => {
          setNewGameOpen(false)
          actions.newGame(difficulty, color)
        }}
      />
      <ConfirmDialog
        open={confirm === 'reset'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Restart this game?"
        description="Your current battle will be cleared."
        confirmLabel="Restart"
        onConfirm={() => actions.newGame(s.difficulty, s.playerColor)}
      />
      <ConfirmDialog
        open={confirm === 'resign'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Resign?"
        description={`The ${opponent.name.toLowerCase()} will never let you forget it.`}
        confirmLabel="Resign"
        destructive
        onConfirm={actions.resign}
      />

      <AnimatePresence>
        {s.outcome && s.phase === 'over' && (
          <ResultScreen
            key="result"
            outcome={s.outcome}
            opponent={s.opponent}
            moves={s.moves}
            onPlayAgain={() => actions.newGame(s.difficulty, s.playerColor)}
            onHome={() => {
              // Closing the result screen ends the battle's theme lock (D2).
              useThemeLock.getState().unlock()
              navigate('/')
            }}
            onReview={() => {
              useThemeLock.getState().unlock()
              navigate(`/review/${gameIdFor(s.startedAt)}`)
            }}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
