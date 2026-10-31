import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'
import { unlockAudio } from './lib/sound'
import { startAutosave } from './storage/autosave'
import { loadBattle } from './storage/battle-storage'
import { useGameStore, isActivePhase } from './store/game-store'
import { useThemeLock } from './store/theme-lock'

startAutosave()

// iOS starts audio only after a tap. Unlocking on any tap is cheap and safe to repeat.
window.addEventListener('pointerdown', unlockAudio, { passive: true })

// A saved battle keeps its theme locked from launch, even before the Game screen opens (D2).
void loadBattle().then((saved) => {
  const lock = useThemeLock.getState()
  if (isActivePhase(useGameStore.getState().phase)) return // a battle already started this session
  if (saved) lock.lock(saved.theme === 'light' ? 'light' : 'dark')
  else if (lock.lockedTheme) lock.unlock()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
