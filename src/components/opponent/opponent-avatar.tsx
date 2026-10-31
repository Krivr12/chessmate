import type { OpponentId } from '@/logic/opponents'
import type { Mood } from '@/logic/types'
import { Chicken } from './chicken'
import { Frog } from './frog'

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
  return opponent === 'chicken' ? (
    <Chicken mood={mood} className={className} />
  ) : (
    <Frog mood={mood} className={className} />
  )
}
