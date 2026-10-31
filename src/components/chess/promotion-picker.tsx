import { useEffect, useRef } from 'react'
import type { Color, Square } from 'chess.js'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { toGrid } from '@/logic/board-grid'
import { PIECE_NAMES } from '@/logic/board-pieces'
import type { PromotionPiece } from '@/store/game-store'
import { PieceSvg } from './pieces'

/** Order matches the mockup and the plan: queen first, then the underpromotions. */
const OPTIONS: PromotionPiece[] = ['q', 'n', 'r', 'b']

type PromotionPickerProps = {
  /** Square the pawn promotes on. */
  square: Square
  /** Board is shown from Black's side. */
  flipped: boolean
  /** Color of the promoting pawn (the player). */
  color: Color
  onChoose: (piece: PromotionPiece) => void
  onCancel: () => void
}

/**
 * Popover on the promotion square. The four pieces stack from that square toward the
 * board center, over a dimmed scrim. Tapping the scrim or pressing Escape cancels and keeps
 * the pawn selected. Focus moves into the picker and returns to the board when it closes.
 */
export function PromotionPicker({ square, flipped, color, onChoose, onCancel }: PromotionPickerProps) {
  const reduceMotion = useReducedMotion()
  const firstButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null
    firstButton.current?.focus()
    return () => returnTo?.focus?.()
  }, [])

  const { col, row } = toGrid(square, flipped)
  // Stack toward the center: from the top edge downward, from the bottom edge upward.
  const step = row < 4 ? 1 : -1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose a promotion piece"
      className="absolute inset-0 z-30"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
    >
      <div className="absolute inset-0 bg-black/35" aria-hidden="true" onClick={onCancel} />
      {OPTIONS.map((piece, i) => (
        <motion.button
          key={piece}
          ref={i === 0 ? firstButton : undefined}
          type="button"
          aria-label={`Promote to ${PIECE_NAMES[piece]}`}
          onClick={() => onChoose(piece)}
          className="absolute flex items-center justify-center rounded-lg border border-border bg-card shadow-md outline-none focus-visible:ring-3 focus-visible:ring-primary"
          style={{
            left: `${col * 12.5}%`,
            top: `${(row + i * step) * 12.5}%`,
            width: '12.5%',
            height: '12.5%',
          }}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.14, delay: reduceMotion ? 0 : i * 0.03 }}
        >
          <PieceSvg type={piece} color={color} className="h-[82%] w-[82%]" />
        </motion.button>
      ))}
    </div>
  )
}
