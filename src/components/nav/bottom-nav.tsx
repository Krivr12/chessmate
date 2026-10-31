import { BookOpen, House, Puzzle, UserRound, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/puzzles', label: 'Puzzles', icon: Puzzle },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

/**
 * Bottom tab bar. The active tab is shown by its accent color and its label, so color is never
 * the only cue. Sits above the iOS home indicator through the safe-area inset.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-[430px] items-stretch justify-around">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-16 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive ? 'text-primary' : 'text-text-secondary',
                )
              }
            >
              <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
