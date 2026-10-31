import { useId, useRef, useState, type KeyboardEvent } from 'react'
import type { Color, Square } from 'chess.js'
import { AnimatePresence, motion } from 'motion/react'
import { useShallow } from 'zustand/react/shallow'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { fromGrid, toGrid } from '@/logic/board-grid'
import { initialPieces, PIECE_NAMES, type PieceState } from '@/logic/board-pieces'
import { cn } from '@/lib/utils'
import { useGameStore, type PromotionPiece } from '@/store/game-store'
import { useSettingsStore } from '@/store/settings-store'
import { PieceSvg } from './pieces'
import { PromotionPicker } from './promotion-picker'

const SPRING = { type: 'spring', stiffness: 400, damping: 32 } as const
const DEFAULT_ARROW_COLOR = '#FF8F93'

export type BoardArrow = { from: Square; to: Square; color?: string }

/** Everything the board draws. Screens build this from their own state (game, puzzle, lesson). */
export type BoardView = {
  pieces: PieceState[]
  selected: Square | null
  legalTargets: Square[]
  lastMove: { from: Square; to: Square } | null
  checkSquare: Square | null
  /** Squares to mark for a hint. `from` gets a ring; `to` too when the hint shows a destination. */
  hint: { from: Square; to: Square } | null
  pendingPromotion: { from: Square; to: Square } | null
  /** Color of the promoting pawn, used to draw the promotion choices. */
  promotionColor: Color
  /** Called when a square is tapped. */
  selectSquare: (square: Square) => void
  choosePromotion: (piece: PromotionPiece) => void
  cancelPromotion: () => void
}

export type BoardSurfaceProps = {
  view: BoardView
  /** Draw Black at the bottom. */
  flipped: boolean
  /** Mark the board as disabled for assistive tech (taps are still passed to `selectSquare`). */
  locked?: boolean
  /** Tint the last move's squares when the move is known. */
  highlightLast?: boolean
  /** Square tints, for example `{ e4: '#FFE17A' }`. */
  highlights?: Partial<Record<Square, string>>
  /** Arrows drawn over the board. */
  arrows?: BoardArrow[]
  label?: string
}

/**
 * Presentational board. It knows nothing about the game store, so the live game, the review,
 * puzzles, and lessons all share the same squares, pieces, arrows, and promotion picker.
 */
export function BoardSurface({
  view: s,
  flipped,
  locked = false,
  highlightLast = true,
  highlights,
  arrows = [],
  label = 'Chessboard',
}: BoardSurfaceProps) {
  const reduceMotion = useReducedMotion()
  const [focusSquare, setFocusSquare] = useState<Square>(flipped ? 'e7' : 'e2')
  const refs = useRef(new Map<Square, HTMLButtonElement>())
  const markerBase = useId().replace(/:/g, '')

  const onBoard = s.pieces.filter((p) => p.square !== null)
  const bySquare = new Map(onBoard.map((p) => [p.square as Square, p]))

  // One arrowhead marker per color, so every arrow keeps its own tint.
  const arrowColors = [...new Set(arrows.map((a) => a.color ?? DEFAULT_ARROW_COLOR))]
  const markerId = (color: string) => `${markerBase}-${arrowColors.indexOf(color)}`
  const center = (sq: Square) => {
    const { col, row } = toGrid(sq, flipped)
    return { x: col + 0.5, y: row + 0.5 }
  }

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
      aria-label={label}
      aria-disabled={locked}
    >
      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
        {squares.map((sq) => {
          const { col, row } = toGrid(sq, flipped)
          const isLight = (col + row) % 2 === 0
          const piece = bySquare.get(sq)
          const isTarget = s.legalTargets.includes(sq)
          const isLast = highlightLast && (s.lastMove?.from === sq || s.lastMove?.to === sq)
          const isHint = s.hint?.from === sq || s.hint?.to === sq
          const tint = highlights?.[sq]
          const labelText = [
            sq,
            piece ? `${piece.color === 'w' ? 'white' : 'black'} ${PIECE_NAMES[piece.type]}` : 'empty',
            s.selected === sq && 'selected',
            isTarget && (piece ? 'capture' : 'legal move'),
            s.checkSquare === sq && 'in check',
            isHint && 'hint',
            tint && 'highlighted',
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
              aria-label={labelText}
              tabIndex={sq === focusSquare ? 0 : -1}
              onFocus={() => setFocusSquare(sq)}
              onKeyDown={(e) => onKeyDown(e, sq)}
              onClick={() => s.selectSquare(sq)}
              className={cn(
                'relative outline-none focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-inset',
                isLight ? 'bg-board-light' : 'bg-board-dark',
              )}
            >
              {tint && <span className="absolute inset-0" style={{ backgroundColor: tint, opacity: 0.55 }} />}
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
                  // Keyed by type: a promotion remounts this layer and pops the piece into its new shape.
                  key={p.type}
                  className="flex h-[82%] w-[82%]"
                  initial={reduceMotion ? false : { scale: 0.6 }}
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

      {arrows.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 8 8"
          aria-hidden="true"
        >
          <defs>
            {arrowColors.map((color) => (
              <marker
                key={color}
                id={markerId(color)}
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="0.4"
                markerHeight="0.4"
                orient="auto"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={color} />
              </marker>
            ))}
          </defs>
          {arrows.map((a, i) => {
            const from = center(a.from)
            const to = center(a.to)
            const color = a.color ?? DEFAULT_ARROW_COLOR
            return (
              <line
                key={`${a.from}-${a.to}-${i}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={color}
                strokeWidth={0.16}
                strokeLinecap="round"
                opacity={0.9}
                markerEnd={`url(#${markerId(color)})`}
              />
            )
          })}
        </svg>
      )}

      {s.pendingPromotion && (
        <PromotionPicker
          square={s.pendingPromotion.to}
          flipped={flipped}
          color={s.promotionColor}
          onChoose={s.choosePromotion}
          onCancel={s.cancelPromotion}
        />
      )}
    </div>
  )
}

export type ChessboardProps = {
  /** Show this position instead of the live game. Board becomes read-only. */
  fen?: string
  /** Disable moves. The live position still shows when no `fen` is given. */
  readOnly?: boolean
  /** Side at the bottom of the board. Defaults to the player's color. */
  orientation?: Color
  /** Square tints, for example `{ e4: '#FFE17A' }`. */
  highlights?: Partial<Record<Square, string>>
  /** Arrows drawn over the board (for example the engine's better move). */
  arrows?: BoardArrow[]
}

/** A static view: no selection, no overlays, no promotion, and no clicks. */
function readOnlyView(live: BoardView, fen?: string): BoardView {
  return {
    ...live,
    pieces: fen ? initialPieces(fen) : live.pieces,
    selected: null,
    legalTargets: [],
    lastMove: null,
    checkSquare: null,
    hint: null,
    pendingPromotion: null,
    selectSquare: () => {},
    choosePromotion: () => {},
    cancelPromotion: () => {},
  }
}

/** The live game board: reads the game store and passes the view to `BoardSurface`. */
export function Chessboard({ fen, readOnly = false, orientation, highlights, arrows = [] }: ChessboardProps = {}) {
  const live = useGameStore(
    useShallow((st): BoardView => ({
      pieces: st.pieces,
      selected: st.selected,
      legalTargets: st.legalTargets,
      lastMove: st.lastMove,
      checkSquare: st.checkSquare,
      hint: st.hint,
      pendingPromotion: st.pendingPromotion,
      promotionColor: st.playerColor,
      selectSquare: st.selectSquare,
      choosePromotion: st.choosePromotion,
      cancelPromotion: st.cancelPromotion,
    })),
  )
  const phase = useGameStore((st) => st.phase)
  const playerColor = useGameStore((st) => st.playerColor)
  const highlightLast = useSettingsStore((st) => st.highlightLastMove)
  const isReadOnly = readOnly || fen !== undefined
  const view = isReadOnly ? readOnlyView(live, fen) : live
  const flipped = (orientation ?? playerColor) === 'b'
  return (
    <BoardSurface
      view={view}
      flipped={flipped}
      locked={isReadOnly || phase !== 'player'}
      highlightLast={highlightLast}
      highlights={highlights}
      arrows={arrows}
    />
  )
}
