import { describe, expect, it } from 'vitest'
import { chickenTalk, pickLine, trashTalk, type TalkCategory } from './trash-talk'

const CATEGORIES = Object.keys(trashTalk) as TalkCategory[]

describe('opponent word banks', () => {
  it('the chicken bank has lines for every category the frog bank has', () => {
    for (const cat of CATEGORIES) {
      expect(chickenTalk[cat], cat).toBeDefined()
      expect(chickenTalk[cat].length, cat).toBeGreaterThan(0)
    }
  })

  it('the chicken never reuses a frog line', () => {
    const frogLines = new Set(CATEGORIES.flatMap((c) => trashTalk[c]))
    for (const cat of CATEGORIES) {
      for (const line of chickenTalk[cat]) expect(frogLines.has(line), line).toBe(false)
    }
  })

  it('picks from the bank it is given, and never repeats back to back', () => {
    const seen = new Set<string>()
    let prev = ''
    for (let i = 0; i < 30; i++) {
      const line = pickLine('blunder', () => 0.5, chickenTalk)
      expect(chickenTalk.blunder).toContain(line)
      if (chickenTalk.blunder.length > 1) expect(line).not.toBe(prev)
      prev = line
      seen.add(line)
    }
    expect(seen.size).toBeGreaterThan(0)
  })
})
