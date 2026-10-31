import { lazy, Suspense } from 'react'

const Landing = lazy(() => import('./landing'))

/** `/` always shows Landing, so every app open starts there. */
export default function RootRoute() {
  return (
    <Suspense fallback={null}>
      <Landing />
    </Suspense>
  )
}
