import type { Grade } from '@/logic/types'

export type GraphPoint = {
  /** 0 is the start position. Point i is the position after i moves. */
  index: number
  /** Win % for the player at that point, 0 to 100. */
  win: number
  /** Grade of the move that led to this point, when it was the player's move. */
  grade?: Grade
}

const W = 300
const H = 96

/** Marker shape per grade. Shape carries the meaning, so color is never the only cue. */
function Marker({ x, y, grade }: { x: number; y: number; grade: Grade }) {
  if (grade === 'blunder') return <rect x={x - 4} y={y - 4} width={8} height={8} className="fill-current" />
  if (grade === 'mistake') return <polygon points={`${x},${y - 5} ${x + 5},${y + 4} ${x - 5},${y + 4}`} className="fill-current" />
  if (grade === 'inaccuracy') return <rect x={x - 3} y={y - 3} width={6} height={6} transform={`rotate(45 ${x} ${y})`} className="fill-current" />
  return <circle cx={x} cy={y} r={3} className="fill-current" />
}

/**
 * Win chance across the whole game, drawn as SVG. Tapping a point jumps to that position.
 * The line is the player's win %. Grades show as shapes on the player's moves.
 */
export function EvalGraph({
  points,
  current,
  onSelect,
}: {
  points: GraphPoint[]
  current: number
  onSelect: (index: number) => void
}) {
  const n = Math.max(1, points.length - 1)
  const x = (i: number) => (i / n) * W
  const y = (win: number) => H - (Math.max(0, Math.min(100, win)) / 100) * H
  const drawn = points.filter((p) => p.win !== undefined)
  const path = drawn.map((p, k) => `${k === 0 ? 'M' : 'L'}${x(p.index).toFixed(1)},${y(p.win).toFixed(1)}`).join(' ')

  return (
    <div className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-24 w-full overflow-visible rounded-xl bg-surface-2 text-primary"
        role="img"
        aria-label="Win chance graph. Tap a point to jump to that move."
      >
        <line x1={0} x2={W} y1={H / 2} y2={H / 2} className="stroke-border" strokeDasharray="4 4" />
        <path d={path} fill="none" className="stroke-current" strokeWidth={2} strokeLinejoin="round" />
        {points.map((p) => (
          <g key={p.index}>
            {p.grade && p.grade !== 'best' && <Marker x={x(p.index)} y={y(p.win)} grade={p.grade} />}
            <rect
              x={x(p.index) - W / (2 * n)}
              y={0}
              width={W / n}
              height={H}
              fill="transparent"
              className="cursor-pointer outline-none focus-visible:stroke-primary"
              tabIndex={0}
              role="button"
              aria-label={`Move ${p.index}: win chance ${Math.round(p.win)}%`}
              aria-current={p.index === current ? 'step' : undefined}
              onClick={() => onSelect(p.index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(p.index)
                }
              }}
            />
          </g>
        ))}
        <line
          x1={x(current)}
          x2={x(current)}
          y1={0}
          y2={H}
          className="stroke-text-primary"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      </svg>
      <p className="text-[11px] text-text-secondary">
        Shapes mark your moves: circle best or great, diamond inaccuracy, triangle mistake, square blunder.
      </p>
    </div>
  )
}
