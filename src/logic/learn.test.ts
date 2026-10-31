import { describe, expect, it } from 'vitest'
import {
  boardFenAt,
  lessonStates,
  mergeLessonStep,
  trackPercent,
  validateLesson,
  type Lesson,
  type LessonProgress,
} from './learn'

const lesson = (id: string, order: number, track: Lesson['track'] = 'basics'): Lesson => ({
  id,
  title: id,
  track,
  order,
  steps: [{ type: 'text', body: 'hi' }],
})

describe('lesson states', () => {
  const lessons = [lesson('a', 1), lesson('b', 2), lesson('c', 3)]

  it('locks a lesson until the one before it is done', () => {
    const states = lessonStates(lessons, new Map())
    expect(states.get('a')).toBe('new')
    expect(states.get('b')).toBe('locked')
    expect(states.get('c')).toBe('locked')
  })

  it('shows in-progress and done states', () => {
    const progress = new Map<string, LessonProgress>([
      ['a', { lessonId: 'a', stepsDone: 4, completedAt: 1 }],
      ['b', { lessonId: 'b', stepsDone: 2 }],
    ])
    const states = lessonStates(lessons, progress)
    expect(states.get('a')).toBe('done')
    expect(states.get('b')).toBe('in-progress')
    expect(states.get('c')).toBe('locked')
  })

  it('computes track percent from completed lessons', () => {
    const progress = new Map<string, LessonProgress>([['a', { lessonId: 'a', stepsDone: 4, completedAt: 1 }]])
    expect(trackPercent(lessons, progress)).toBe(33)
    expect(trackPercent([], progress)).toBe(0)
  })
})

describe('lesson progress', () => {
  it('stores steps and marks completion once', () => {
    const mid = mergeLessonStep(undefined, 'a', 2, 4, 10)
    expect(mid).toEqual({ lessonId: 'a', stepsDone: 2, completedAt: undefined })
    const done = mergeLessonStep(mid, 'a', 4, 4, 20)
    expect(done.completedAt).toBe(20)
    const again = mergeLessonStep(done, 'a', 4, 4, 30)
    expect(again.completedAt).toBe(20)
  })

  it('never moves progress backwards', () => {
    const later = mergeLessonStep(undefined, 'a', 3, 4, 10)
    expect(mergeLessonStep(later, 'a', 1, 4, 11).stepsDone).toBe(3)
  })
})

describe('board position in a lesson', () => {
  const steps: Lesson['steps'] = [
    { type: 'text', body: 'intro' },
    { type: 'demo', body: 'a', fen: '8/8/8/8/8/8/8/K6k w - - 0 1' },
    { type: 'text', body: 'carry on' },
    { type: 'quiz', question: 'q', options: ['x', 'y'], answer: 0, explanation: '' },
  ]

  it('carries the last position forward and looks ahead for the first one', () => {
    expect(boardFenAt(steps, 0)).toBe('8/8/8/8/8/8/8/K6k w - - 0 1')
    expect(boardFenAt(steps, 2)).toBe('8/8/8/8/8/8/8/K6k w - - 0 1')
    expect(boardFenAt([{ type: 'text', body: 'only text' }], 0)).toBeNull()
  })
})

describe('lesson validator', () => {
  it('reports an illegal scripted move', () => {
    const bad: Lesson = {
      id: 'bad',
      title: 'bad',
      track: 'basics',
      order: 1,
      steps: [{ type: 'demo', body: 'x', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', moves: ['e2e5'] }],
    }
    expect(validateLesson(bad, ['basics']).join(' ')).toMatch(/illegal move e2e5/)
  })

  it('reports an unknown track and a bad quiz answer', () => {
    const bad: Lesson = {
      id: 'bad2',
      title: 'bad',
      track: 'basics',
      order: 1,
      steps: [{ type: 'quiz', question: 'q', options: ['a', 'b'], answer: 5, explanation: '' }],
    }
    expect(validateLesson(bad, ['tactics']).join(' ')).toMatch(/unknown track/)
    expect(validateLesson(bad, ['basics']).join(' ')).toMatch(/out of range/)
  })
})
