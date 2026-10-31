import type { Color, Square } from 'chess.js'
import { cn } from '@/lib/utils'
import { initialPieces } from '@/logic/board-pieces'
import { PieceSvg } from './pieces'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

type MiniBoardProps = {
  /** Position to show. Only piece placement is read; no game state is needed. */
  fen: string
  /** Side at the bottom. */
  orientation?: Color
  className?: string
}

/**
 * Static, non-interactive board for thumbnails (puzzle list, Home cards).
 * Uses the same square colors and piece set as the live board.
 */
export function MiniBoard({ fen, orientation = 'w', className }: MiniBoardProps) {
  const flipped = orientation === 'b'
  const pieces = initialPieces(fen).filter((p) => p.square !== null)
  const bySquare = new Map(pieces.map((p) => [p.square as Square, p]))

  return (
    <div
      role="img"
      aria-label="Chess position"
      className={cn('relative aspect-square w-full overflow-hidden rounded-md border border-border', className)}
    >
      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
        {Array.from({ length: 64 }, (_, i) => {
          const row = Math.floor(i / 8)
          const col = i % 8
          const file = flipped ? 7 - col : col
          const rank = flipped ? row : 7 - row
          const square = `${FILES[file]}${rank + 1}` as Square
          const piece = bySquare.get(square)
          const isLight = (col + row) % 2 === 0
          return (
            <div key={square} className={cn('relative', isLight ? 'bg-board-light' : 'bg-board-dark')}>
              {piece && (
                <PieceSvg type={piece.type} color={piece.color} className="absolute inset-[6%] h-[88%] w-[88%]" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
