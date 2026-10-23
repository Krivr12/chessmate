import { ChevronRight, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HintCard({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-24 flex-col justify-between rounded-2xl bg-mint p-4 text-left text-[#08352d] transition duration-150',
        'outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-45',
      )}
    >
      <Lightbulb className="size-6" strokeWidth={1.8} aria-hidden="true" />
      <span className="flex items-end justify-between gap-2">
        <span>
          <span className="block text-base font-semibold">Hint</span>
          <span className="block text-xs opacity-80">Show the best move</span>
        </span>
        <ChevronRight className="size-5" strokeWidth={1.8} aria-hidden="true" />
      </span>
    </button>
  )
}
