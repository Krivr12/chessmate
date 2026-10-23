import { memo } from 'react'
import type { Color, PieceSymbol } from 'chess.js'

/**
 * Custom Staunton-style silhouettes drawn for ChessMate (100 × 100 viewBox).
 * Shapes are drawn as separate parts so the outlines between them read as
 * collar and band details. Colors come from CSS variables in index.css.
 */
const BASE = 'M22 90h56a4 4 0 0 0 4-4v-3a6 6 0 0 0-6-6H24a6 6 0 0 0-6 6v3a4 4 0 0 0 4 4Z'

const SHAPES: Record<PieceSymbol, string[]> = {
  p: [
    'M31 77c1-13 7-21 11-27h16c4 6 10 14 11 27Z',
    'M35 50h30a3.5 3.5 0 0 0 0-7H35a3.5 3.5 0 0 0 0 7Z',
    'M50 17a13 13 0 1 1 0 26a13 13 0 1 1 0-26Z',
    BASE,
  ],
  r: [
    'M32 77l3-35h30l3 35Z',
    'M27 42h46v-7H27Z',
    'M27 35V18h9v7h8v-7h12v7h8v-7h9v17Z',
    'M29 77h42v-6H29Z',
    BASE,
  ],
  n: [
    'M30 77c0-13 5-19 12-26-7 1-14-1-19-5-4-3-4-7-1-10l13-13 3-12 8 8c14-1 27 9 29 29 1 11-1 21-4 29Z',
    'M37.5 31a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0Z',
    'M27 77h47v-6H27Z',
    BASE,
  ],
  b: [
    'M33 77c0-10 6-16 9-22h16c3 6 9 12 9 22Z',
    'M34 55h32a3.5 3.5 0 0 0 0-7H34a3.5 3.5 0 0 0 0 7Z',
    'M50 17c11 7 17 16 17 24 0 5-5 7-17 7s-17-2-17-7c0-8 6-17 17-24Z',
    'M50 8a5 5 0 1 1 0 10a5 5 0 1 1 0-10Z',
    'M29 77h42v-6H29Z',
    BASE,
  ],
  q: [
    'M30 77L19 34l13 19 2-27 9 24 7-27 7 27 9-24 2 27 13-19-11 43Z',
    'M19 28a5 5 0 1 1 0 10a5 5 0 1 1 0-10Z',
    'M34 20a5 5 0 1 1 0 10a5 5 0 1 1 0-10Z',
    'M50 15a5 5 0 1 1 0 10a5 5 0 1 1 0-10Z',
    'M66 20a5 5 0 1 1 0 10a5 5 0 1 1 0-10Z',
    'M81 28a5 5 0 1 1 0 10a5 5 0 1 1 0-10Z',
    'M28 77h44v-7H28Z',
    BASE,
  ],
  k: [
    'M46 36h8v18h-8Z',
    'M30 77c-4-9-9-17-9-24 0-9 9-13 16-11 5 1 10 6 13 12 3-6 8-11 13-12 7-2 16 2 16 11 0 7-5 15-9 24Z',
    'M46.5 9h7v8h8v7h-8v12h-7V24h-8v-7h8Z',
    'M28 77h44v-7H28Z',
    BASE,
  ],
}

type PieceProps = { type: PieceSymbol; color: Color; className?: string }

export const PieceSvg = memo(function PieceSvg({ type, color, className }: PieceProps) {
  const isWhite = color === 'w'
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <g
        fill={isWhite ? 'var(--piece-player-fill)' : 'var(--piece-opponent-fill)'}
        stroke={isWhite ? 'var(--piece-player-stroke)' : 'var(--piece-opponent-detail)'}
        strokeWidth={isWhite ? 4 : 2.6}
        strokeLinejoin="round"
      >
        {SHAPES[type].map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  )
})
