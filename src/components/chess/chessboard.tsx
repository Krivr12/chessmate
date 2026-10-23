import { useRef, useState, type KeyboardEvent } from 'react'
import type { Square } from 'chess.js'
import { AnimatePresence, motion } from 'motion/react'
import { useShallow } from 'zustand/react/shallow'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import { PIECE_NAMES } from '@/logic/board-pieces'
import { useGameStore } from '@/store/game-store'
import { PieceSvg } from './pieces'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const SPRING = { type: 'spring', stiffness: 400, damping: 32 } as const

/** Visual column/row (0..7, top-left origin) for a square, given orientation. */
function toGrid(square: Square, flipped: boolean) {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  return flipped ? { col: 7 - file, row: rank } : { col: file, row: 7 - rank }
}

function fromGrid(col: number, row: number, flipped: boolean): Square {
  const file = flipped ? 7 - col : col
  const rank = flipped ? row : 7 - row
  return `${FILES[file]}${rank + 1}` as Square
}

export function Chessboard() {
  const s = useGameStore(
    useShallow((st) => ({
      pieces: st.pieces,
      selected: st.selected,
      legalTargets: st.legalTargets,
      lastMove: st.lastMove,
      checkSquare: st.checkSquare,
      hint: st.hint,
      playerColor: st.playerColor,
      phase: st.phase,
      selectSquare: st.selectSquare,
    })),
  )
  const reduceMotion = useReducedMotion()
  const flipped = s.playerColor === 'b'
  const [focusSquare, setFocusSquare] = useState<Square>(flipped ? 'e7' : 'e2')
  const refs = useRef(new Map<Square, HTMLButtonElement>())

  const onBoard = s.pieces.filter((p) => p.square !== null)
  const bySquare = new Map(onBoard.map((p) => [p.square as Square, p]))
  const locked = s.phase !== 'player'

  const onKeyDown = (e: KeyboardEvent, square: Square) => {
    const delta: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    }
    const d = delta[e.key]
    if (!d) return
    e.preventDefault()
    const { col, row } = toGrid(square, flipped)
    const next = fromGrid(
      Math.min(7, Math.max(0, col + d[0])),
      Math.min(7, Math.max(0, row + d[1])),
      flipped,
    )
    setFocusSquare(next)
    refs.current.get(next)?.focus()
  }

  const squares: Square[] = []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) squares.push(fromGrid(col, row, flipped))
  }

  return (
    <div
      className="relative aspect-square w-full touch-manipulation overflow-hidden rounded-lg border border-border select-none"
      role="grid"
      aria-label="Chessboard"
      aria-disabled={locked}
    >
      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
        {squares.map((sq) => {
          const { col, row } = toGrid(sq, flipped)
          const isLight = (col + row) % 2 === 0
          const piece = bySquare.get(sq)
          const isTarget = s.legalTargets.includes(sq)
          const isLast = s.lastMove?.from === sq || s.lastMove?.to === sq
          const isHint = s.hint?.from === sq || s.hint?.to === sq
          const label = [
            sq,
            piece ? `${piece.color === 'w' ? 'white' : 'black'} ${PIECE_NAMES[piece.type]}` : 'empty',
            s.selected === sq && 'selected',
            isTarget && (piece ? 'capture' : 'legal move'),
            s.checkSquare === sq && 'in check',
            isHint && 'hint',
          ]
            .filter(Boolean)
            .join(', ')
          return (
            <button
              key={sq}
              ref={(el) => {
                if (el) refs.current.set(sq, el)
                else refs.current.delete(sq)
              }}
              type="button"
              role="gridcell"
              aria-label={label}
              tabIndex={sq === focusSquare ? 0 : -1}
              onFocus={() => setFocusSquare(sq)}
              onKeyDown={(e) => onKeyDown(e, sq)}
              onClick={() => s.selectSquare(sq)}
              className={cn(
                'relative outline-none focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-inset',
                isLight ? 'bg-board-light' : 'bg-board-dark',
              )}
            >
              {isLast && <span className="absolute inset-0 bg-board-last-move/75" />}
              {s.selected === sq && <span className="absolute inset-0 bg-board-selected/90" />}
              {s.checkSquare === sq && (
                <span className="absolute inset-0 animate-pulse bg-[radial-gradient(circle,var(--board-check)_35%,transparent_75%)] ring-3 ring-board-check ring-inset" />
              )}
              {isHint && (
                <span className="absolute inset-0.5 animate-pulse rounded-md ring-4 ring-mint ring-inset motion-reduce:animate-none" />
              )}
              {isTarget && !piece && (
                <span className="absolute top-1/2 left-1/2 size-[30%] -translate-1/2 rounded-full bg-board-legal-move/70" />
              )}
              {isTarget && piece && (
                <span className="absolute inset-[6%] rounded-full border-[3px] border-board-legal-move/75" />
              )}
              {col === 0 && (
                <span className="absolute top-0.5 left-1 text-[10px] leading-none font-semibold text-[#0b2a3d]/60">
                  {sq[1]}
                </span>
              )}
              {row === 7 && (
                <span className="absolute right-1 bottom-0.5 text-[10px] leading-none font-semibold text-[#0b2a3d]/60">
                  {sq[0]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <AnimatePresence initial={false}>
          {onBoard.map((p) => {
            const { col, row } = toGrid(p.square as Square, flipped)
            const isSelected = s.selected === p.square
            const pos = { x: `${col * 100}%`, y: `${row * 100}%` }
            return (
              <motion.div
                key={p.id}
                className="absolute top-0 left-0 flex h-[12.5%] w-[12.5%] items-center justify-center"
                style={{ zIndex: isSelected ? 3 : s.lastMove?.to === p.square ? 2 : 1 }}
                initial={{ ...pos, scale: 0.4, opacity: 0 }}
                animate={{ ...pos, scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0, transition: { duration: reduceMotion ? 0 : 0.2 } }}
                transition={reduceMotion ? { duration: 0 } : SPRING}
              >
                <motion.div
                  className="flex h-[82%] w-[82%]"
                  animate={
                    isSelected && !reduceMotion ? { y: '-8%', scale: 1.08 } : { y: '0%', scale: 1 }
                  }
                  transition={{ duration: 0.15 }}
                >
                  <PieceSvg type={p.type} color={p.color} className="h-full w-full drop-shadow-sm" />
                </motion.div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
