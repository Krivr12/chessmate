import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { TabLayout } from '@/components/nav/tab-layout'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeSync } from '@/components/layout/theme-sync'

// Every screen is its own chunk. The service worker precaches them, so all routes work offline.
const RootRoute = lazy(() => import('@/screens/root-route'))
const Home = lazy(() => import('@/screens/home'))
const Puzzles = lazy(() => import('@/screens/puzzles'))
const Learn = lazy(() => import('@/screens/learn'))
const Profile = lazy(() => import('@/screens/profile'))
const Game = lazy(() => import('@/screens/game'))
const Review = lazy(() => import('@/screens/review'))
const PuzzlePlay = lazy(() => import('@/screens/puzzle-play'))
const Lesson = lazy(() => import('@/screens/lesson'))
const Settings = lazy(() => import('@/screens/settings'))
const Help = lazy(() => import('@/screens/help'))
const ResultPreview = lazy(() => import('@/screens/result-preview')) // TEMP: delete with result-preview.tsx

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <ThemeSync />
        <AppShell>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<RootRoute />} />

              <Route element={<TabLayout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/puzzles" element={<Puzzles />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route path="/play" element={<Game />} />
              <Route path="/review/:gameId" element={<Review />} />
              <Route path="/puzzle/:puzzleId" element={<PuzzlePlay />} />
              <Route path="/lesson/:lessonId" element={<Lesson />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
              <Route path="/preview/result/:outcome" element={<ResultPreview />} /> {/* TEMP */}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </BrowserRouter>
  )
}
