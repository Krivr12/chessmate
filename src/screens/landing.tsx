import { useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { KnightLogo } from '@/components/chess/knight-logo'
import { Button } from '@/components/ui/button'
import { APP_NAME, APP_TAGLINE } from '@/constants'
import { preloadEngine } from '@/engine/engine-service'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

/**
 * Soft accent blobs behind the content. Colors come from theme variables, so they
 * follow light and dark mode. Purely decorative.
 */
function BackgroundShapes() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-dvh w-full"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {/* large blob, top right */}
      <path
        d="M300 40C360 -10 430 30 440 100C450 170 400 220 340 210C280 200 240 150 250 90C255 60 270 50 300 40Z"
        style={{ fill: 'var(--blue)' }}
        opacity="0.14"
      />
      {/* round blob, left middle */}
      <circle cx="40" cy="330" r="46" style={{ fill: 'var(--lavender)' }} opacity="0.2" />
      {/* soft blob, bottom left */}
      <path
        d="M-20 640C30 600 110 610 150 660C190 710 170 790 110 820C50 850 -30 830 -40 760C-48 710 -40 670 -20 640Z"
        style={{ fill: 'var(--mint)' }}
        opacity="0.16"
      />
      {/* small blob, right middle */}
      <path
        d="M340 470C370 455 400 480 398 510C396 540 362 548 344 530C326 512 318 482 340 470Z"
        style={{ fill: 'var(--yellow)' }}
        opacity="0.22"
      />
      {/* accent dots */}
      <circle cx="70" cy="180" r="6" style={{ fill: 'var(--blue)' }} opacity="0.6" />
      <circle cx="330" cy="600" r="5" style={{ fill: 'var(--mint)' }} opacity="0.7" />
    </svg>
  )
}

/** Start page. It is the first screen on every app open. "Enter game" opens Home. */
export default function Landing() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    preloadEngine()
  }, [])

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden px-6 pt-10 pb-8">
      <BackgroundShapes />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.75, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={
            reduceMotion ? { duration: 0.2 } : { type: 'spring', stiffness: 260, damping: 18 }
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
            <KnightLogo title={`${APP_NAME} logo`} className="size-20 text-primary" />
          </motion.div>
        </motion.div>

        <motion.div
          className="flex flex-col gap-2"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-[2rem] font-extrabold tracking-tight text-text-primary">{APP_NAME}</h1>
          <p className="text-sm text-text-secondary">{APP_TAGLINE}</p>
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
