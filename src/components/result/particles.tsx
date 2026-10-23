import { useMemo } from 'react'
import { motion } from 'motion/react'

type ParticlesProps = { colors: string[]; count?: number; direction: 'burst' | 'fall' }

/** Small, cheap particle layer (30 to 60 shapes). Callers skip it for reduced motion. */
export function Particles({ colors, count = 40, direction }: ParticlesProps) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // Deterministic pseudo-random spread keeps render pure.
        const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
        return {
          id: i,
          color: colors[i % colors.length],
          left: r(1) * 100,
          size: 6 + r(2) * 8,
          round: r(3) > 0.5,
          dx: (r(4) - 0.5) * 160,
          dy: direction === 'burst' ? -(80 + r(5) * 220) : 240 + r(5) * 200,
          rotate: (r(6) - 0.5) * 360,
          delay: r(7) * 0.25,
        }
      }),
    [colors, count, direction],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map((p) => (
        <motion.span
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: direction === 'burst' ? '45%' : '-5%',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.round ? '9999px' : '3px',
          }}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0], x: p.dx, y: p.dy, rotate: p.rotate, scale: 1 }}
          transition={{ duration: 1.6, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  )
}
