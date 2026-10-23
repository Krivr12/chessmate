import { ArrowDownRight, ArrowUpRight, ChartNoAxesColumnIncreasing, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { roundWin } from '@/logic/win-percent'

export function WinChanceCard({ win, trend }: { win: number; trend: number | null }) {
  const pct = roundWin(win)
  const delta = trend === null ? 0 : Math.round(trend)
  return (
    <div className="flex min-h-24 flex-col justify-between rounded-2xl bg-blue p-4 text-[#092c45]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <ChartNoAxesColumnIncreasing className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Win chance
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="-m-2 rounded-full p-2 outline-none focus-visible:ring-2 focus-visible:ring-[#092c45]"
              aria-label="About win chance"
            >
              <Info className="size-4" strokeWidth={1.8} aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Estimated from the engine&apos;s evaluation</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[1.625rem] leading-none font-bold" aria-live="polite">
          {pct}%
        </span>
        {delta !== 0 && (
          <span className="mb-0.5 flex items-center text-xs font-semibold">
            {delta > 0 ? (
              <ArrowUpRight className="size-4" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-4" aria-hidden="true" />
            )}
            <span className="sr-only">Last move changed it by</span>
            {delta > 0 ? '+' : ''}
            {delta}
          </span>
        )}
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[#cde7fc]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Win chance"
      >
        <div
          className="h-full rounded-full bg-[#092c45] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
