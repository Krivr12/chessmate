import type { Color } from 'chess.js'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { OpponentAvatar } from '@/components/opponent/opponent-avatar'
import { PieceSvg } from '@/components/chess/pieces'
import type { PuzzleGoal } from '@/logic/puzzle-goal'
import { cn } from '@/lib/utils'

const BOTTOM_SHEET_CLASS =
  'mx-auto w-full max-w-[430px] rounded-t-3xl border-x border-border pb-[env(safe-area-inset-bottom)]'

type PuzzleGoalSheetProps = {
  open: boolean
  goal: PuzzleGoal
  playerColor: Color
  opponent: 'frog' | 'cat'
  onStart: () => void
}

export function PuzzleGoalSheet({ open, goal, playerColor, opponent, onStart }: PuzzleGoalSheetProps) {
  const colorLabel = playerColor === 'w' ? 'White' : 'Black'
  
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onStart()}>
      <SheetContent side="bottom" className={BOTTOM_SHEET_CLASS}>
        <SheetHeader className="items-center gap-3 pt-6 text-center">
          <div className="size-16 shrink-0 rounded-2xl border border-border bg-surface-2 p-1.5">
            <OpponentAvatar opponent={opponent} mood="idle" className="h-full w-full" />
          </div>
          <SheetTitle className="text-lg">{goal.title}</SheetTitle>
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium',
              'border-border bg-surface-2 text-text-primary',
            )}
          >
            <PieceSvg type="k" color={playerColor} className="size-5" />
            <span>You play {colorLabel}</span>
          </div>
        </SheetHeader>
        
        <p className="px-4 text-center text-sm text-text-secondary">{goal.body}</p>
        
        <SheetFooter className="px-4 pb-4">
          <Button size="lg" className="w-full" onClick={onStart}>
            Start
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
