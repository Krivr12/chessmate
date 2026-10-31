import { describe, expect, it } from 'vitest'
import { validateLesson } from '@/logic/learn'
import { LESSONS, TRACKS, trackIds } from './index'

describe('learn content', () => {
  it('has the planned 16 lessons across four tracks', () => {
    expect(TRACKS.map((t) => t.id)).toEqual(['basics', 'tactics', 'openings', 'endgames'])
    expect(LESSONS).toHaveLength(16)
  })

  it('has unique lesson ids and a valid order inside each track', () => {
    const ids = LESSONS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of TRACKS) {
      const orders = LESSONS.filter((l) => l.track === t.id).map((l) => l.order).sort((a, b) => a - b)
      expect(orders, t.id).toEqual(orders.map((_, i) => i + 1))
    }
  })

  it.each(LESSONS.map((l) => [l.id, l] as const))('%s: every FEN and move is legal', (_id, lesson) => {
    expect(validateLesson(lesson, trackIds())).toEqual([])
  })
})
