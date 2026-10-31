import { useEffect } from 'react'
import { UserRound } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { preloadEngine } from '@/engine/engine-service'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

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

/**
 * Start page. It is the first screen on every app open. "Enter game" opens Home.
 */
export default function Landing() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    preloadEngine()
  }, [])

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden px-6 pt-10 pb-8">
      <BackgroundShapes />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.75, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={
            reduceMotion
              ? { duration: 0.2 }
              : { type: 'spring', stiffness: 260, damping: 18 }
          }
        >
          {/* Placeholder until the final character art is added. */}
          <span className="flex size-28 items-center justify-center rounded-full border border-border bg-card text-primary">
            <UserRound className="size-14" strokeWidth={1.6} aria-hidden="true" />
          </span>
        </motion.div>
      </div>

      <motion.div
        className="relative z-10 flex flex-col gap-3"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <Button size="lg" className="w-full" onClick={() => navigate('/home', { replace: true })}>
          Enter game
        </Button>
      </motion.div>
    </main>
  )
}
