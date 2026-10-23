import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AppShellProps = {
  children: ReactNode
  className?: string
}

/**
 * Portrait, mobile-first frame: content is capped at about 430 px and centered
 * on larger screens, with safe-area padding for notches and home indicators.
 */
export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-dvh w-full bg-app-bg">
      <div
        className={cn(
          'mx-auto flex min-h-dvh w-full max-w-[430px] flex-col',
          'pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]',
          'pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
