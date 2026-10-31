import { useEffect, useState } from 'react'
import type { Color } from 'chess.js'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { KnightLogo } from '@/components/chess/knight-logo'
import { NewGameSheet } from '@/components/chess/new-game-sheet'
import { Button } from '@/components/ui/button'
import { APP_NAME, APP_TAGLINE } from '@/constants'
import { preloadEngine } from '@/engine/engine-service'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import type { Difficulty } from '@/logic/types'
import { loadBattle } from '@/storage/battle-storage'
import { isActivePhase, useGameStore } from '@/store/game-store'

/** Faint geometric shapes behind the content. Purely decorative. */
function BackgroundShapes() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-dvh w-full text-surface-3"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <circle cx="330" cy="90" r="120" fill="currentColor" opacity="0.35" />
      <rect
        x="-40"
        y="560"
        width="180"
        height="180"
        rx="36"
        fill="currentColor"
        opacity="0.3"
        transform="rotate(18 50 650)"
      />
      <circle cx="60" cy="170" r="6" fill="currentColor" opacity="0.8" />
      <circle cx="340" cy="520" r="4" fill="currentColor" opacity="0.8" />
      <rect
        x="300"
        y="690"
        width="28"
        height="28"
        rx="6"
        fill="currentColor"
        opacity="0.6"
        transform="rotate(20 314 704)"
      />
    </svg>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  const [newGameOpen, setNewGameOpen] = useState(false)
  const inMemory = useGameStore((st) => isActivePhase(st.phase))
  const [savedOnDisk, setSavedOnDisk] = useState(false)
  const hasSavedBattle = inMemory || savedOnDisk

  useEffect(() => {
    preloadEngine()
    let cancelled = false
    void loadBattle().then((b) => !cancelled && setSavedOnDisk(b !== null))
    return () => {
      cancelled = true
    }
  }, [])

  const resume = async () => {
    if (!inMemory) {
      const saved = await loadBattle()
      if (saved) useGameStore.getState().resume(saved)
    }
    navigate('/play')
  }

  const start = (difficulty: Difficulty, color: Color) => {
    setNewGameOpen(false)
    useGameStore.getState().newGame(difficulty, color)
    navigate('/play')
  }

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden px-6 pt-10 pb-8">
      <BackgroundShapes />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.75, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={
            reduceMotion
              ? { duration: 0.2 }
              : { type: 'spring', stiffness: 260, damping: 18 }
          }
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }
            }
          >
            <KnightLogo className="size-20 text-primary" />
          </motion.div>
        </motion.div>

        <motion.div
          className="flex flex-col gap-2"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-[2rem] font-extrabold tracking-tight text-text-primary">
            {APP_NAME}
          </h1>
          <p className="text-sm text-text-secondary">{APP_TAGLINE}</p>
        </motion.div>
      </div>

      <motion.div
        className="relative z-10 flex flex-col gap-3"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {hasSavedBattle && (
          <Button variant="outline" size="lg" className="w-full" onClick={() => void resume()}>
            Resume battle
          </Button>
        )}
        <Button size="lg" className="w-full" onClick={() => setNewGameOpen(true)}>
          Start
          <ArrowRight data-icon="inline-end" strokeWidth={1.8} aria-hidden="true" />
        </Button>
      </motion.div>
      <NewGameSheet open={newGameOpen} onOpenChange={setNewGameOpen} onPlay={start} />
    </main>
  )
}
