import tracksJson from './tracks.json'
import type { Lesson, Track } from '@/logic/learn'

// Lessons are plain JSON so they are easy to edit. Each one is checked by content/learn/learn.test.ts.
const modules = import.meta.glob<Lesson>('./lessons/*.json', { eager: true, import: 'default' })

export const TRACKS: Track[] = tracksJson as Track[]
export const LESSONS: Lesson[] = Object.values(modules)

export const trackIds = (): string[] => TRACKS.map((t) => t.id)
export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id)
