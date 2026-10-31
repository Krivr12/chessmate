import { useSettingsStore } from '@/store/settings-store'

/** Light pulse for moves, stronger for check and the result (plan M22). */
const PATTERNS: Record<'move' | 'strong', number | number[]> = {
  move: 8,
  strong: [20, 40, 20],
}

export type HapticKind = keyof typeof PATTERNS

/** navigator.vibrate works on Android browsers. iOS Safari does not support it. */
export function hapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

/** Vibrates if the Settings toggle is on and the device supports it. */
export function vibrate(kind: HapticKind) {
  if (!useSettingsStore.getState().haptics || !hapticsSupported()) return
  navigator.vibrate(PATTERNS[kind])
}
