import { isActivePhase, toSavedBattle, useGameStore } from '@/store/game-store'
import { requestPersistentStorage, saveBattle } from './battle-storage'

/** Save the current battle after every move (debounced) and when the tab is hidden. */
export function startAutosave() {
  let timer: ReturnType<typeof setTimeout> | undefined

  const save = () => {
    const s = useGameStore.getState()
    if (!isActivePhase(s.phase) || s.moves.length === 0) return
    void saveBattle(toSavedBattle(s))
    requestPersistentStorage()
  }

  useGameStore.subscribe((s, prev) => {
    if (s.moves === prev.moves) return
    clearTimeout(timer)
    timer = setTimeout(save, 300)
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save()
  })
}
