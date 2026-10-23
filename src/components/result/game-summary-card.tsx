import { motion } from 'motion/react'
import { Footprints } from 'lucide-react'
import { GRADE_META } from '@/lib/grade-meta'
import { gameAccuracy } from '@/logic/accuracy'
import type { MoveRecord } from '@/logic/types'

export function GameSummaryCard({ moves, reduceMotion }: { moves: MoveRecord[]; reduceMotion: boolean }) {
  const accuracy = gameAccuracy(moves)
  const mine = moves.filter((m) => m.by === 'player')
  const count = (g: string) => mine.filter((m) => m.grade === g).length
  const stats = [
    { label: 'Moves', value: mine.length, icon: Footprints },
    { label: 'Best', value: count('best'), icon: GRADE_META.best.icon },
    { label: 'Mistakes', value: count('mistake'), icon: GRADE_META.mistake.icon },
    { label: 'Blunders', value: count('blunder'), icon: GRADE_META.blunder.icon },
  ]
  const pct = accuracy === null ? null : Math.round(accuracy)

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-end justify-between">
        <span className="text-sm font-semibold">Accuracy</span>
        <span className="text-2xl font-bold">{pct === null ? '–' : `${pct}%`}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        <motion.div
          className="h-full rounded-full bg-mint"
          initial={{ width: reduceMotion ? `${pct ?? 0}%` : '0%' }}
          animate={{ width: `${pct ?? 0}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </div>
      <dl className="mt-4 grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl bg-surface-2 py-2">
            <s.icon className="size-4 text-text-secondary" strokeWidth={1.8} aria-hidden="true" />
            <dd className="text-base font-bold">{s.value}</dd>
            <dt className="text-[11px] text-text-secondary">{s.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  )
}
