import { memo } from 'react'
import type { Mood } from '@/logic/types'

const NAVY = '#0b2a3d'
const ORANGE = '#ff6b1a'
const BEAK = '#ff8a1f'

/** The chicken opponent. White and warm-yellow body, orange beak and comb, navy eyes (plan M21). */
export const Chicken = memo(function Chicken({
  mood,
  className,
}: {
  mood: Mood
  className?: string
}) {
  const pupilDy = mood === 'think' ? -3 : mood === 'sad' ? 2 : 0
  const eyeR = mood === 'shock' ? 6 : 4.2
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {/* tail */}
      <path d="M20 62 Q6 46 16 34 Q24 48 32 56 Z" fill="#ffd36e" stroke="#e6dccb" strokeWidth="1.5" />
      {/* body and wing */}
      <ellipse cx="50" cy="66" rx="32" ry="26" fill="#ffffff" stroke="#e6dccb" strokeWidth="2" />
      <ellipse cx="42" cy="68" rx="15" ry="9" fill="#ffe9a8" />
      {/* feet */}
      <path d="M42 90 L38 97 M42 90 L46 97 M58 90 L54 97 M58 90 L62 97" stroke={BEAK} strokeWidth="3" strokeLinecap="round" />
      {/* head */}
      <circle cx="58" cy="36" r="20" fill="#ffffff" stroke="#e6dccb" strokeWidth="2" />
      {/* comb */}
      <circle cx="50" cy="16" r="4.5" fill={ORANGE} />
      <circle cx="58" cy="13" r="5" fill={ORANGE} />
      <circle cx="66" cy="16" r="4.5" fill={ORANGE} />
      {/* wattle */}
      <ellipse cx="72" cy="50" rx="4" ry="6" fill={ORANGE} />
      {/* eyes */}
      <circle cx="52" cy="33" r={eyeR + 1.5} fill="#ffffff" />
      <circle cx="66" cy="33" r={eyeR + 1.5} fill="#ffffff" />
      <circle cx="52" cy={33 + pupilDy} r={eyeR} fill={NAVY} />
      <circle cx="66" cy={33 + pupilDy} r={eyeR} fill={NAVY} />
      {mood === 'sad' && (
        <path d="M45 26l10 3M79 26l-10 3" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" />
      )}
      {mood === 'happy' && (
        <>
          <ellipse cx="50" cy="45" rx="4" ry="2.5" fill="#ff8f93" opacity="0.7" />
          <ellipse cx="70" cy="45" rx="4" ry="2.5" fill="#ff8f93" opacity="0.7" />
        </>
      )}
      {/* beak: closed normally, open when shocked */}
      {mood === 'shock' ? (
        <>
          <path d="M74 34 L90 34 L76 40 Z" fill={BEAK} />
          <path d="M74 44 L88 54 L74 48 Z" fill={BEAK} />
        </>
      ) : (
        <path d="M74 36 L90 42 L74 47 Z" fill={BEAK} />
      )}
    </svg>
  )
})
