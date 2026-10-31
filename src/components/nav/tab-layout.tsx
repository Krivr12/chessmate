import { Outlet, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { BottomNav } from './bottom-nav'

/**
 * Wraps the four tab routes (Home, Puzzles, Learn, Profile) and shows the bottom navigation.
 * Full-screen flows (Game, Review, Puzzle play, Lesson, Settings, Help) sit outside this layout,
 * so the bar is hidden there.
 *
 * Provides page transitions (fade+slide) between tab routes, respecting prefers-reduced-motion.
 */
export function TabLayout() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="flex flex-1 flex-col overflow-y-auto"
            initial={
              reduceMotion ? false : { opacity: 0, y: 4 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              reduceMotion ? undefined : { opacity: 0, y: -4 }
            }
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav />
    </>
  )
}
