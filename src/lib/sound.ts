import type { Move } from 'chess.js'
import { useSettingsStore } from '@/store/settings-store'

export type SoundKind = 'move' | 'capture' | 'check' | 'promotion' | 'win' | 'lose' | 'hint'

/** [frequency Hz, duration s, waveform]. Short synthesized tones, so no audio files are needed. */
type Tone = [number, number, OscillatorType]
const TONES: Record<SoundKind, Tone[]> = {
  move: [[660, 0.06, 'sine']],
  capture: [[220, 0.1, 'triangle']],
  check: [
    [880, 0.08, 'sine'],
    [1100, 0.1, 'sine'],
  ],
  promotion: [
    [523, 0.08, 'sine'],
    [659, 0.08, 'sine'],
    [784, 0.14, 'sine'],
  ],
  win: [
    [523, 0.12, 'sine'],
    [659, 0.12, 'sine'],
    [784, 0.12, 'sine'],
    [1046, 0.3, 'sine'],
  ],
  lose: [
    [392, 0.2, 'sine'],
    [330, 0.2, 'sine'],
    [262, 0.4, 'sine'],
  ],
  hint: [
    [988, 0.1, 'sine'],
    [1318, 0.12, 'sine'],
  ],
}

let ctx: AudioContext | null = null

/**
 * iOS only starts audio after a user gesture, so the context is created on the first tap.
 * Safe to call on every pointer event.
 */
export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return
  try {
    ctx = new Ctor()
    void ctx.resume()
  } catch {
    ctx = null
  }
}

/** Plays a sound if the Settings toggle is on and audio is unlocked. Otherwise does nothing. */
export function playSound(kind: SoundKind) {
  if (!useSettingsStore.getState().sound || !ctx || ctx.state !== 'running') return
  let t = ctx.currentTime
  for (const [freq, dur, wave] of TONES[kind]) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = wave
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur + 0.02)
    t += dur * 0.9
  }
}

/** Which sound fits a move: promotion, then capture, then check, then a plain move. */
export function soundForMove(move: Pick<Move, 'promotion' | 'captured' | 'san'>): SoundKind {
  if (move.promotion) return 'promotion'
  if (move.captured) return 'capture'
  if (move.san.includes('+') || move.san.includes('#')) return 'check'
  return 'move'
}
