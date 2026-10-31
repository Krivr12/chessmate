import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { META_KEYS, getMeta } from '@/storage/meta'

const Landing = lazy(() => import('./landing'))

/**
 * `/` shows Landing on first launch only (D3). After that the app opens on Home.
 * If the flag cannot be read, Landing is shown, which is the safe default.
 */
export default function RootRoute() {
  const [seen, setSeen] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    getMeta<boolean>(META_KEYS.hasSeenWelcome).then(
      (v) => !cancelled && setSeen(v === true),
      () => !cancelled && setSeen(false),
    )
    return () => {
      cancelled = true
    }
  }, [])

  if (seen === null) return null
  if (seen) return <Navigate to="/home" replace />
  return (
    <Suspense fallback={null}>
      <Landing />
    </Suspense>
  )
}
