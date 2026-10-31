import { useState } from 'react'
import type { Color } from 'chess.js'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import { CAPTURABLE, captureSentence, type CapturedSummary, type CaptureCounts } from '@/logic/captured'
import { PIECE_NAMES } from '@/logic/board-pieces'
import { PieceSvg } from './pieces'

type CapturedPanelProps = {
  playerColor: Color
  opponentName: string
  summary: CapturedSummary
  /** Material difference from the player's side. Positive means the player is ahead. */
  advantage: number
}

type Side = 'you' | 'opp'

function total(counts: CaptureCounts): number {
  return CAPTURABLE.reduce((sum, type) => sum + counts[type], 0)
}

/** Side toggle. `aria-pressed` carries the selection. The dot marks new captures the side has not been viewed for. */
function SideChip({
  pressed,
  unseen,
  onClick,
  children,
}: {
  pressed: boolean
  unseen: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'flex h-8 max-w-24 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
        pressed ? 'border-primary bg-primary/15 text-text-primary' : 'border-border bg-card text-text-secondary',
      )}
    >
      <span className="truncate">{children}</span>
      {unseen && <span className="size-2 shrink-0 rounded-full bg-mint" aria-label="New captures" role="img" />}
    </button>
  )
}

/** Captured pieces under the Hint and Win chance cards. One side shows at a time to keep the play screen from scrolling. */
export function CapturedPanel({ playerColor, opponentName, summary, advantage }: CapturedPanelProps) {
  const opponentColor: Color = playerColor === 'w' ? 'b' : 'w'
  const reduceMotion = useReducedMotion()
  const [side, setSide] = useState<Side>('you')

  const totals: Record<Side, number> = { you: total(summary.byPlayer), opp: total(summary.byOpponent) }
  const [storedSeen, setSeen] = useState<Record<Side, number>>(totals)
  // A new game or an undo can lower the counts. Clamping keeps later captures visible as new.
  const seen: Record<Side, number> = {
    you: Math.min(storedSeen.you, totals.you),
    opp: Math.min(storedSeen.opp, totals.opp),
  }

  const choose = (next: Side) => {
    // Opening a side marks it viewed. The side being left is also viewed, since it was on screen.
    setSeen((prev) => ({ ...prev, [side]: totals[side], [next]: totals[next] }))
    setSide(next)
  }

  const shown: Side = side
  const counts = shown === 'you' ? summary.byPlayer : summary.byOpponent
  const pieceColor = shown === 'you' ? opponentColor : playerColor
  const shownName = shown === 'you' ? 'You' : opponentName
  const footer = shown === 'you' ? 'Pieces you captured' : `Pieces ${opponentName} captured`

  // The side ahead gets the chip. Equal material shows no chip.
  const lead =
    advantage > 0 ? { name: 'You', value: advantage } : advantage < 0 ? { name: opponentName, value: -advantage } : null

  return (
    <section aria-label="Captured pieces" className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary">Captured</h2>
        <div className="flex min-w-0 items-center gap-1.5" role="group" aria-label="Choose side">
          <SideChip pressed={shown === 'you'} unseen={shown !== 'you' && totals.you > seen.you} onClick={() => choose('you')}>
            You
          </SideChip>
          <SideChip pressed={shown === 'opp'} unseen={shown !== 'opp' && totals.opp > seen.opp} onClick={() => choose('opp')}>
            {opponentName}
          </SideChip>
        </div>
      </div>

      <ul
        className="grid grid-cols-5 gap-1.5"
        aria-label={captureSentence(shownName, counts, 'captured')}
      >
        {CAPTURABLE.map((type) => {
          const n = counts[type]
          return (
            <li
              key={type}
              className={cn(
                'flex flex-col items-center gap-1 py-1',
                n === 0 && 'opacity-40',
              )}
            >
              <PieceSvg type={type} color={pieceColor} className="size-9" />
              <motion.span
                key={n}
                className="text-sm leading-none font-bold text-text-secondary"
                initial={reduceMotion ? false : { scale: 1.35 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.18 }}
                aria-hidden="true"
              >
                ×{n}
              </motion.span>
              <span className="sr-only">
                {n} {PIECE_NAMES[type]}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-text-secondary">{footer}</span>
        {lead && (
          <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {lead.name} +{lead.value}
          </span>
        )}
      </div>
    </section>
  )
}
