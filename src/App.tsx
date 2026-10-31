import { BrowserRouter, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Game from '@/screens/game'
import Landing from '@/screens/landing'
import ResultPreview from '@/screens/result-preview' // TEMP: delete with result-preview.tsx

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/play" element={<Game />} />
            <Route path="/preview/result/:outcome" element={<ResultPreview />} /> {/* TEMP */}
            <Route path="*" element={<Landing />} />
          </Routes>
        </AppShell>
        <Toaster position="top-center" />
      </TooltipProvider>
    </BrowserRouter>
  )
}
