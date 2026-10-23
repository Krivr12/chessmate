import { memo } from 'react'
import type { Mood } from '@/logic/types'

const NAVY = '#0b2a3d'

const MOUTHS: Record<Mood, string> = {
  idle: 'M40 66q10 6 20 0',
  think: 'M42 67h14',
  happy: 'M34 62q16 16 32 0',
  sad: 'M38 70q12-9 24 0',
  shock: 'M44 67a6 6 0 1 0 12 0a6 6 0 1 0-12 0Z',
}

/** The frog opponent. Mint body, pale belly, navy features (README §12). */
export const Frog = memo(function Frog({
  mood,
  className,
}: {
  mood: Mood
  className?: string
}) {
  const pupilDy = mood === 'think' ? -3 : mood === 'sad' ? 2 : 0
  const eyeR = mood === 'shock' ? 7 : 5.5
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <ellipse cx="50" cy="62" rx="40" ry="31" fill="#79f2c6" />
      <ellipse cx="50" cy="72" rx="24" ry="17" fill="#d9fbee" />
      <circle cx="30" cy="34" r="15" fill="#79f2c6" />
      <circle cx="70" cy="34" r="15" fill="#79f2c6" />
      <circle cx="30" cy="34" r="10" fill="#fff" />
      <circle cx="70" cy="34" r="10" fill="#fff" />
      <circle cx="30" cy={34 + pupilDy} r={eyeR} fill={NAVY} />
      <circle cx="70" cy={34 + pupilDy} r={eyeR} fill={NAVY} />
      {mood === 'sad' && (
        <path d="M19 20l18 6M81 20l-18 6" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
      )}
      {mood === 'happy' && (
        <>
          <circle cx="24" cy="58" r="5" fill="#ff8f93" opacity="0.6" />
          <circle cx="76" cy="58" r="5" fill="#ff8f93" opacity="0.6" />
        </>
      )}
      <path
        d={MOUTHS[mood]}
        fill={mood === 'shock' ? NAVY : 'none'}
        stroke={NAVY}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
})
