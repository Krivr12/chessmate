import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronRight, CircleCheck, Lock } from 'lucide-react'
import { Link } from 'react-router'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { lessonStates, trackPercent, type LessonProgress, type LessonState } from '@/logic/learn'
import { LESSONS, TRACKS } from '@/content/learn'
import { listLessonProgress } from '@/storage/lessons'

const STATE_TEXT: Record<LessonState, string> = {
  new: 'Start',
  'in-progress': 'Continue',
  done: 'Done',
  locked: 'Finish the lesson before this one',
}

/** One lesson row. The state is shown as text and an icon, never by color alone. */
function LessonCard({
  title,
  order,
  state,
  stepsDone,
  total,
  to,
}: {
  title: string
  order: number
  state: LessonState
  stepsDone: number
  total: number
  to: string
}) {
  const body = (
    <>
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
          state === 'done'
            ? 'bg-primary ring-2 ring-primary/20'
            : 'bg-surface-3 text-text-primary',
        )}
        aria-hidden="true"
      >
        {state === 'done' ? (
          <CircleCheck className="size-5 text-primary-foreground dark:text-app-bg" strokeWidth={2.5} />
        ) : (
          order
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('truncate text-sm font-semibold', state === 'done' ? 'text-primary' : 'text-text-primary')}>{title}</span>
        <span className="flex items-center gap-1 text-xs text-text-secondary">
          {state === 'locked' && <Lock className="size-3.5" strokeWidth={2} aria-hidden="true" />}
          {state === 'in-progress' ? `${STATE_TEXT[state]} (step ${stepsDone + 1} of ${total})` : STATE_TEXT[state]}
        </span>
      </span>
      {state !== 'locked' && <ChevronRight className="size-5 shrink-0 text-text-secondary" aria-hidden="true" />}
    </>
  )
  const className =
    'flex items-center gap-3 rounded-2xl border border-border bg-card p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring'
  if (state === 'locked') {
    return (
      <div className={cn(className, 'opacity-60')} aria-disabled="true">
        {body}
      </div>
    )
  }
  return (
    <Link to={to} className={cn(className, state === 'done' && 'border-primary/30')}>
      {body}
    </Link>
  )
}

export default function Learn() {
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map())

  useEffect(() => {
    let cancelled = false
    void listLessonProgress().then((list) => {
      if (!cancelled) setProgress(new Map(list.map((p) => [p.lessonId, p])))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const states = useMemo(() => lessonStates(LESSONS, progress), [progress])

  // Empty state if no lessons are available
  if (LESSONS.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <BookOpen className="size-12 text-text-secondary opacity-50" strokeWidth={1.5} />
        <h1 className="text-lg font-bold text-text-primary">Learn chess basics</h1>
        <p className="text-sm text-text-secondary">More lessons coming soon. Try puzzles or play a game to learn.</p>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 pt-4 pb-4">
      <header className="flex items-center gap-2">
        <BookOpen className="size-6 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <h1 className="text-xl font-bold text-text-primary">Learn</h1>
      </header>

      {TRACKS.map((track) => {
        const lessons = LESSONS.filter((l) => l.track === track.id).sort((a, b) => a.order - b.order)
        const percent = trackPercent(lessons, progress)
        const doneCount = lessons.filter((l) => states.get(l.id) === 'done').length
        return (
          <section key={track.id} className="flex flex-col gap-3" aria-labelledby={`track-${track.id}`}>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id={`track-${track.id}`} className="text-base font-bold text-text-primary">
                  {track.title}
                </h2>
                <span className="text-xs text-text-secondary">
                  {doneCount} of {lessons.length} done
                </span>
              </div>
              <p className="text-sm text-text-secondary">{track.blurb}</p>
              <Progress value={percent} aria-label={`${track.title} progress`} />
            </div>
            <ul className="flex flex-col gap-2">
              {lessons.map((lesson) => {
                const p = progress.get(lesson.id)
                return (
                  <li key={lesson.id}>
                    <LessonCard
                      title={lesson.title}
                      order={lesson.order}
                      state={states.get(lesson.id) ?? 'new'}
                      stepsDone={p?.stepsDone ?? 0}
                      total={lesson.steps.length}
                      to={`/lesson/${lesson.id}`}
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </main>
  )
}
