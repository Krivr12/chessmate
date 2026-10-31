import type { OpponentId } from '@/logic/opponents'
import type { Mood } from '@/logic/types'

/** Sprite file prefix for each opponent. */
const SPRITE_ANIMAL: Record<OpponentId, 'frog' | 'cat'> = {
  frog: 'frog',
  cat: 'cat',
}

/** Sprite file suffix for each mood. Files are cut from the emote sheet by scripts/extract-opponent-sprites.mjs. */
const SPRITE_MOOD: Record<Mood, string> = {
  happy: 'happy',
  sad: 'sad',
  shock: 'shock',
  angry: 'angry',
  think: 'think',
  idle: 'idle',
}

/** The art for whichever opponent the battle or screen uses. */
export function OpponentAvatar({
  opponent,
  mood,
  className,
}: {
  opponent: OpponentId
  mood: Mood
  className?: string
}) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}opponents/${SPRITE_ANIMAL[opponent]}-${SPRITE_MOOD[mood]}.webp`}
      alt=""
      draggable={false}
      className={`object-contain ${className ?? ''}`}
    />
  )
}
