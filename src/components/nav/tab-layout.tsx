import { Outlet } from 'react-router'

/**
 * Wraps the four tab routes (Home, Puzzles, Learn, Profile).
 * The bottom navigation bar is added in M27. Until then, tabs render their content only.
 */
export function TabLayout() {
  return <Outlet />
}
