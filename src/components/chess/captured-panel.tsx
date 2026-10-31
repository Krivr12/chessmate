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

/** One row: the captured pieces of one side, drawn in the captured side's color. */
function CaptureRow({
  label,
  counts,
  pieceColor,
  advantage,
  sentence,
}: {
  label: string
  counts: CaptureCounts
  pieceColor: Color
  advantage: number
  sentence: string
}) {
  const reduceMotion = useReducedMotion()
  return (
    <div role="group" className="flex items-center gap-2" aria-label={sentence}>
      <div className="flex w-14 shrink-0 flex-col">
        <span className="truncate text-xs font-semibold text-text-primary">{label}</span>
        {advantage > 0 && (
          <span className="mt-0.5 w-fit rounded-full bg-mint px-1.5 text-[10px] leading-4 font-bold text-[#072a25]">
            +{advantage}
          </span>
        )}
      </div>
      <ul className="grid flex-1 grid-cols-5 gap-1" aria-hidden="true">
        {CAPTURABLE.map((type) => {
          const n = counts[type]
          return (
            <li
              key={type}
              className={cn(
                'flex flex-col items-center rounded-lg border border-border bg-surface-2 py-1',
                n === 0 && 'opacity-40',
              )}
            >
              <PieceSvg type={type} color={pieceColor} className="size-6" />
              <motion.span
                key={n}
                className="text-[11px] leading-none font-semibold text-text-secondary"
                initial={reduceMotion ? false : { scale: 1.35 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.18 }}
              >
                ×{n}
              </motion.span>
              <span className="sr-only">{PIECE_NAMES[type]}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Captured pieces under the Hint and Win chance cards. */
export function CapturedPanel({ playerColor, opponentName, summary, advantage }: CapturedPanelProps) {
  const opponentColor: Color = playerColor === 'w' ? 'b' : 'w'
  // A side ahead gets the chip. Equal material shows no chip.
  const playerAhead = advantage > 0 ? advantage : 0
  const opponentAhead = advantage < 0 ? -advantage : 0

  return (
    <section aria-label="Captured pieces" className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3">
      <h2 className="text-sm font-semibold text-text-primary">Captured</h2>
      <CaptureRow
        label="You"
        counts={summary.byPlayer}
        pieceColor={opponentColor}
        advantage={playerAhead}
        sentence={captureSentence('You', summary.byPlayer, 'captured')}
      />
      <CaptureRow
        label={opponentName}
        counts={summary.byOpponent}
        pieceColor={playerColor}
        advantage={opponentAhead}
        sentence={captureSentence(opponentName, summary.byOpponent, 'captured')}
      />
    </section>
  )
}
