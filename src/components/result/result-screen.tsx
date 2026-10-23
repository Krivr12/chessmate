import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Frog } from '@/components/opponent/frog'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import type { MoveRecord, Outcome } from '@/logic/types'
import { GameSummaryCard } from './game-summary-card'
import { DrawArt, ToppledKingArt, TrophyArt } from './illustrations'
import { Particles } from './particles'

const CONTENT = {
  win: {
    art: TrophyArt,
    heading: 'You Win!',
    message: 'Sharp play. The frog is not amused.',
    primary: 'Play again',
    variant: 'mint' as const,
    particles: { colors: ['#79f2c6', '#9fd4ff', '#ffe29a'], direction: 'burst' as const },
    frogMood: 'sad' as const,
  },
  loss: {
    art: ToppledKingArt,
    heading: 'Better Luck Next Time',
    message: 'Every game teaches something. Go again?',
    primary: 'Try again',
    variant: 'default' as const,
    particles: { colors: ['#ff8f93', '#15364a'], direction: 'fall' as const },
    frogMood: 'happy' as const,
  },
  draw: {
    art: DrawArt,
    heading: "It's a Draw",
    message: 'Evenly matched. For now.',
    primary: 'Play again',
    variant: 'default' as const,
    particles: null,
    frogMood: 'idle' as const,
  },
}

type ResultScreenProps = {
  outcome: Outcome
  moves: MoveRecord[]
  onPlayAgain: () => void
  onHome: () => void
}

/** Full-screen result state of the Game page (README §6.5). */
export function ResultScreen({ outcome, moves, onPlayAgain, onHome }: ResultScreenProps) {
  const reduceMotion = useReducedMotion()
  const c = CONTENT[outcome.result]
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])
  const ease = [0.16, 1, 0.3, 1] as const

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-app-bg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-heading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {!reduceMotion && c.particles && <Particles {...c.particles} />}
      <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col items-center justify-center gap-6 px-6 pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+24px)] text-center">
        <motion.div
          className="relative"
          initial={reduceMotion ? false : { scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease }}
        >
          <c.art className="size-32" />
          <Frog mood={c.frogMood} className="absolute -right-8 -bottom-2 size-12" />
        </motion.div>
        <div className="flex flex-col gap-2">
          <h2
            id="result-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-[2rem] font-extrabold tracking-tight outline-none"
            aria-live="assertive"
          >
            {c.heading}
          </h2>
          <p className="text-sm text-text-secondary">
            {outcome.reason}. {c.message}
          </p>
        </div>
        <GameSummaryCard moves={moves} reduceMotion={reduceMotion} />
        <div className="flex w-full flex-col gap-3">
          <Button variant={c.variant} size="lg" onClick={onPlayAgain}>
            {c.primary}
          </Button>
          <Button variant="outline" size="lg" onClick={onHome}>
            Home
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
