import { LESSONS, TRACKS } from '@/content/learn'
import type { ExtraProgress } from '@/logic/badges'
import { listLessonProgress } from './lessons'
import { solvedPuzzleIds } from './puzzles'

/** Puzzles solved and Learn tracks completed, for the profile stats and badges. */
export async function getExtraProgress(): Promise<ExtraProgress> {
  const [solved, lessons] = await Promise.all([solvedPuzzleIds(), listLessonProgress()])
  const doneIds = new Set(lessons.filter((p) => p.completedAt !== undefined).map((p) => p.lessonId))
  const learnTracksDone = TRACKS.filter((t) =>
    LESSONS.filter((l) => l.track === t.id).every((l) => doneIds.has(l.id)),
  ).length
  return { puzzlesSolved: solved.size, learnTracksDone }
}

/** The first lesson the player started but has not finished, for the Home "Continue" line. */
export async function getContinueLesson(): Promise<{ id: string; title: string; stepsDone: number; total: number } | null> {
  const lessons = await listLessonProgress()
  for (const lesson of LESSONS) {
    const p = lessons.find((x) => x.lessonId === lesson.id)
    if (p && p.stepsDone > 0 && p.completedAt === undefined) {
      return { id: lesson.id, title: lesson.title, stepsDone: p.stepsDone, total: lesson.steps.length }
    }
  }
  return null
}
