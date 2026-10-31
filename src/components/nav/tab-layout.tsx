import { Outlet } from 'react-router'
import { BottomNav } from './bottom-nav'

/**
 * Wraps the four tab routes (Home, Puzzles, Learn, Profile) and shows the bottom navigation.
 * Full-screen flows (Game, Review, Puzzle play, Lesson, Settings, Help) sit outside this layout,
 * so the bar is hidden there.
 */
export function TabLayout() {
  return (
    <>
      <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      <BottomNav />
    </>
  )
}
