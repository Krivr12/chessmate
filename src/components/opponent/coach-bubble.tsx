import type { ReactNode } from 'react'
import { OpponentAvatar } from './opponent-avatar'
import type { Mood } from '@/logic/types'

interface CoachBubbleProps {
  opponent: 'frog' | 'cat'
  mood: Mood
  title?: string
  children: ReactNode
}

/**
 * Shared coach/narrator bubble used in Learn lessons and Puzzles.
 * Displays an animal avatar with a speech bubble containing optional title and body text.
 */
export function CoachBubble({ opponent, mood, title, children }: CoachBubbleProps) {
  return (
    <section className="flex items-start gap-3" aria-label="Coach" aria-live="polite">
      <div className="size-14 shrink-0 rounded-2xl border border-border bg-surface-2 p-1">
        <OpponentAvatar opponent={opponent} mood={mood} className="h-full w-full" />
      </div>
      <div className="flex-1 rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2.5">
        {title && <h2 className="mb-1 text-sm font-semibold text-text-primary">{title}</h2>}
        <div className="text-sm text-text-primary">{children}</div>
      </div>
    </section>
  )
}
