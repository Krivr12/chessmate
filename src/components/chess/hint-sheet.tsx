import { Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import type { HintInfo } from '@/logic/hint-text'

export const BOTTOM_SHEET_CLASS =
  'mx-auto w-full max-w-[430px] rounded-t-3xl border-x border-border pb-[env(safe-area-inset-bottom)]'

type HintSheetProps = {
  open: boolean
  hint: HintInfo | null
  loading: boolean
  onPlay: () => void
  onDismiss: () => void
  opponentName: string
}

export function HintSheet({ open, hint, loading, onPlay, onDismiss, opponentName }: HintSheetProps) {
  return (
    // Non-modal so the board (and the pulsing hint squares) stay visible above the sheet.
    <Sheet open={open} modal={false} onOpenChange={(o) => !o && onDismiss()}>
      <SheetContent side="bottom" className={BOTTOM_SHEET_CLASS}>
        <SheetHeader className="items-center gap-2 pt-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-mint/15 text-mint">
            <Lightbulb className="size-6" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <SheetTitle className="text-base">Hint</SheetTitle>
          {loading ? (
            <div className="flex w-full flex-col items-center gap-2" aria-label="Finding the best move">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
          ) : hint ? (
            <>
              <p className="text-lg text-text-primary">
                The best move is <strong className="font-bold">{hint.san}</strong>
              </p>
              <SheetDescription>{hint.reason}</SheetDescription>
            </>
          ) : (
            <SheetDescription>{opponentName} is not ready yet. Try again in a moment.</SheetDescription>
          )}
        </SheetHeader>
        <SheetFooter className="gap-2 px-4 pb-6">
          <Button variant="mint" size="lg" disabled={!hint} onClick={onPlay}>
            {hint ? `Play ${hint.san}` : 'Play'}
          </Button>
          <Button variant="outline" size="lg" onClick={onDismiss}>
            Dismiss
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
