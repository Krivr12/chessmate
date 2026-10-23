import type { Grade } from './types'

/** Grade thresholds (win % drop) from README §11. Tune by playtesting. */
export function gradeMove(winBefore: number, winAfter: number, isEngineBest: boolean): Grade {
  const drop = Math.max(0, winBefore - winAfter)
  if (isEngineBest || drop < 1) return 'best'
  if (drop < 3) return 'great'
  if (drop < 6) return 'good'
  if (drop < 10) return 'inaccuracy'
  if (drop < 20) return 'mistake'
  return 'blunder'
}
