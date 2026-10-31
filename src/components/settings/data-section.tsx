import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/layout/confirm-dialog'
import { Button } from '@/components/ui/button'
import { exportBackup, importBackup } from '@/storage/backup'
import * as data from '@/storage/data'
import { useSettingsStore, DEFAULT_SETTINGS, type Settings } from '@/store/settings-store'
import { useThemeLock } from '@/store/theme-lock'

type Action = 'history' | 'puzzles' | 'lessons' | 'settings' | 'everything'

type ActionInfo = { title: string; description: string; confirmLabel: string; done: string; run: () => Promise<void> }

/** Settings go back to defaults, but the theme keeps its value while a battle locks it. */
function resetSettings() {
  const { theme, reset, update } = useSettingsStore.getState()
  const locked = useThemeLock.getState().lockedTheme !== null
  reset()
  if (locked) update({ theme })
}

/** Writes an exported file to the device. */
function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

/** Row in the Data section: label and note on the left, action on the right. */
function Row({ label, note, action }: { label: string; note: string; action: ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-xs text-text-secondary">{note}</span>
      </div>
      {action}
    </div>
  )
}

/** Settings > Data: storage usage, clear actions with confirmation, and backup export and import. */
export function DataSection() {
  const locked = useThemeLock((st) => st.lockedTheme !== null)
  const [usage, setUsage] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<Action | null>(null)
  const [secondCheck, setSecondCheck] = useState(false)
  const [importText, setImportText] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const refreshUsage = () =>
    data.estimateStorage().then((est) =>
      setUsage(est ? `About ${est.usageMB} MB used of ${est.quotaMB} MB` : 'Not available in this browser'),
    )

  useEffect(() => {
    let cancelled = false
    data.estimateStorage().then((est) => {
      if (!cancelled) setUsage(est ? `About ${est.usageMB} MB used of ${est.quotaMB} MB` : 'Not available in this browser')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const actions: Record<Action, ActionInfo> = {
    history: {
      title: 'Clear game history and stats?',
      description: 'Deletes every saved game, your activity days, and badges. Settings and the current battle stay.',
      confirmLabel: 'Clear history',
      done: 'Game history cleared',
      run: data.clearGameHistory,
    },
    puzzles: {
      title: 'Clear puzzle progress?',
      description: 'Deletes which puzzles you solved and your attempts.',
      confirmLabel: 'Clear puzzles',
      done: 'Puzzle progress cleared',
      run: data.clearPuzzleProgress,
    },
    lessons: {
      title: 'Clear learning progress?',
      description: 'Deletes which lessons and steps you finished.',
      confirmLabel: 'Clear learning',
      done: 'Learning progress cleared',
      run: data.clearLearningProgress,
    },
    settings: {
      title: 'Reset settings?',
      description: 'Every setting goes back to its default. The theme stays as it is while a battle is in progress.',
      confirmLabel: 'Reset settings',
      done: 'Settings reset',
      run: async () => resetSettings(),
    },
    everything: {
      title: 'Clear everything?',
      description:
        'Deletes your history, puzzle and learning progress, profile, first-launch flag, and settings, and clears the offline cache. The app will need an internet connection to download its files again on next open.',
      confirmLabel: 'Continue',
      done: 'Everything cleared',
      run: async () => {
        await data.clearAllStoredData()
        await data.clearServiceWorkerCaches()
        resetSettings()
      },
    },
  }

  const runAction = async (info: ActionInfo) => {
    try {
      await info.run()
      toast.success(info.done)
    } catch {
      toast.error('Could not clear the data. Please try again.')
    }
    void refreshUsage()
  }

  const exportNow = async () => {
    try {
      const settings: Settings = useSettingsStore.getState()
      download(await exportBackup(settings), `chessmate-backup-${new Date().toISOString().slice(0, 10)}.json`)
      toast.success('Backup saved to your device')
    } catch {
      toast.error('Could not create the backup')
    }
  }

  const doImport = async () => {
    if (importText === null) return
    try {
      const patch: Partial<Settings> = { ...(await importBackup(importText)) }
      // A battle locks the theme, so an imported theme waits until the battle ends.
      if (useThemeLock.getState().lockedTheme !== null) delete patch.theme
      useSettingsStore.getState().update(patch)
      toast.success('Backup restored')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not restore this backup')
    }
    setImportText(null)
    void refreshUsage()
  }

  const current = confirm ? actions[confirm] : null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-wide text-text-secondary uppercase">Data</h2>
      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
        <Row label="Storage used" note={usage ?? 'Checking...'} action={<span />} />
        <Row
          label="Back up your data"
          note="Saves your history, progress, and settings to a file. The current battle is not included."
          action={
            <Button size="sm" variant="outline" onClick={() => void exportNow()}>
              Export
            </Button>
          }
        />
        <Row
          label="Restore a backup"
          note="Replaces your history and progress with the file's contents."
          action={
            <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()}>
              Import
            </Button>
          }
        />
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Choose a backup file"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) setImportText(await file.text())
          }}
        />
        <Row
          label="Clear game history and stats"
          note="Games, activity days, and badges."
          action={
            <Button size="sm" variant="destructive" onClick={() => setConfirm('history')}>
              Clear
            </Button>
          }
        />
        <Row
          label="Clear puzzle progress"
          note="Solved puzzles and attempts."
          action={
            <Button size="sm" variant="destructive" onClick={() => setConfirm('puzzles')}>
              Clear
            </Button>
          }
        />
        <Row
          label="Clear learning progress"
          note="Finished lessons and steps."
          action={
            <Button size="sm" variant="destructive" onClick={() => setConfirm('lessons')}>
              Clear
            </Button>
          }
        />
        <Row
          label="Reset settings"
          note={`Back to defaults (theme ${DEFAULT_SETTINGS.theme} unless a battle is running).`}
          action={
            <Button size="sm" variant="destructive" onClick={() => setConfirm('settings')}>
              Reset
            </Button>
          }
        />
        <Row
          label="Clear everything"
          note={
            locked
              ? 'End your current battle first. Clear it in Appearance above.'
              : 'All of the above, plus your profile and the offline cache.'
          }
          action={
            <Button size="sm" variant="destructive" disabled={locked} onClick={() => setConfirm('everything')}>
              Clear all
            </Button>
          }
        />
      </div>

      {current && (
        <ConfirmDialog
          open={confirm !== null && !secondCheck}
          onOpenChange={(o) => !o && setConfirm(null)}
          title={current.title}
          description={current.description}
          confirmLabel={current.confirmLabel}
          destructive={confirm !== 'settings'}
          onConfirm={() => {
            if (confirm === 'everything') setSecondCheck(true)
            else void runAction(current)
          }}
        />
      )}
      <ConfirmDialog
        open={secondCheck}
        onOpenChange={(o) => {
          if (!o) {
            setSecondCheck(false)
            setConfirm(null)
          }
        }}
        title="Are you sure?"
        description="This cannot be undone. Export a backup first if you want to keep your data."
        confirmLabel="Clear everything"
        destructive
        onConfirm={() => {
          setConfirm(null)
          setSecondCheck(false)
          void runAction(actions.everything)
        }}
      />
      <ConfirmDialog
        open={importText !== null}
        onOpenChange={(o) => !o && setImportText(null)}
        title="Replace your data with this backup?"
        description="Your current history and progress will be replaced by the file's contents."
        confirmLabel="Restore"
        destructive
        onConfirm={() => void doImport()}
      />
    </section>
  )
}
