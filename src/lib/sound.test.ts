import { describe, expect, it } from 'vitest'
import { soundForMove } from './sound'

describe('soundForMove', () => {
  it('plays the plain move sound for an ordinary move', () => {
    expect(soundForMove({ san: 'Nf3', captured: undefined, promotion: undefined })).toBe('move')
  })

  it('prefers promotion, then capture, then check', () => {
    expect(soundForMove({ san: 'exd8=Q+', captured: 'r', promotion: 'q' })).toBe('promotion')
    expect(soundForMove({ san: 'Bxf7+', captured: 'p', promotion: undefined })).toBe('capture')
    expect(soundForMove({ san: 'Qh5+', captured: undefined, promotion: undefined })).toBe('check')
    expect(soundForMove({ san: 'Qh7#', captured: undefined, promotion: undefined })).toBe('check')
  })
})
