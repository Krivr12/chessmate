import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useShallow } from 'zustand/react/shallow'
import { Frog } from '@/components/opponent/frog'
import { Button } from '@/components/ui/button'
import { GRADE_META } from '@/lib/grade-meta'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/store/game-store'

/** Frog avatar + speech bubble: grade headline of your last move and the frog's line. */
export function MoveCommentary() {
  const { commentary, phase, engineStatus, retryEngine } = useGameStore(
    useShallow((s) => ({
      commentary: s.commentary,
      phase: s.phase,
      engineStatus: s.engineStatus,
      retryEngine: s.retryEngine,
    })),
  )
  // Show the frog's reaction for a moment before switching to its thinking face.
  const [settledId, setSettledId] = useState(commentary.id)
  useEffect(() => {
    const t = setTimeout(() => setSettledId(commentary.id), 900)
    return () => clearTimeout(t)
  }, [commentary.id])
  const reacting = settledId !== commentary.id

  const engineDown = engineStatus === 'error'
  const waking = engineStatus === 'loading' && phase !== 'over'
  const thinking = phase === 'opponent' || phase === 'grading'
  const mood = engineDown ? 'sad' : (thinking || waking) && !reacting ? 'think' : commentary.mood
  const meta = commentary.grade ? GRADE_META[commentary.grade] : null

  return (
    <section className="flex items-start gap-3" aria-label="Opponent">
      <div className="relative size-14 shrink-0 rounded-2xl border border-border bg-surface-2 p-1">
        <Frog mood={mood} className="h-full w-full" />
        {thinking && !reacting && (
          <span className="absolute -right-1 -bottom-1 flex gap-0.5 rounded-full bg-surface-3 px-1.5 py-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1 rounded-full bg-text-secondary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </span>
        )}
      </div>

      <div className="relative min-h-14 flex-1 rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2.5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={engineDown ? 'error' : commentary.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            aria-live="polite"
          >
            {engineDown ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-text-primary">I can&apos;t wake up. Try again?</p>
                <Button size="sm" variant="outline" onClick={retryEngine}>
                  <RefreshCw strokeWidth={1.8} aria-hidden="true" />
                  Retry
                </Button>
              </div>
            ) : (
              <>
                {meta && (
                  <span
                    className={cn(
                      'mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors',
                      meta.className,
                    )}
                  >
                    <meta.icon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                    {meta.headline}
                  </span>
                )}
                <p className="text-sm text-text-primary">
                  {waking && !commentary.line ? 'Waking up...' : `“${commentary.line}”`}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
