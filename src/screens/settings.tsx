import { useState, type ReactNode } from 'react'
import { ArrowLeft, ChevronRight, Monitor, Moon, Sun } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/layout/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DataSection } from '@/components/settings/data-section'
import { unlockAudio } from '@/lib/sound'
import { hapticsSupported } from '@/lib/haptics'
import { DIFFICULTIES, DIFFICULTY_ORDER, isDifficulty } from '@/logic/difficulty'
import { useGameStore } from '@/store/game-store'
import { useSettingsStore, type DefaultColor, type ThemeSetting } from '@/store/settings-store'
import { useThemeLock } from '@/store/theme-lock'

/** A titled group of rows, separated by thin dividers. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-wide text-text-secondary uppercase">{title}</h2>
      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
        {children}
      </div>
    </section>
  )
}

/** One setting: label and optional note on the left, control on the right. */
function Row({ label, note, control }: { label: string; note?: string; control: ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {note && <span className="text-xs text-text-secondary">{note}</span>}
      </div>
      {control}
    </div>
  )
}

const THEME_ITEMS: { value: ThemeSetting; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
]

const COLOR_ITEMS: { value: DefaultColor; label: string }[] = [
  { value: 'w', label: 'White' },
  { value: 'b', label: 'Black' },
  { value: 'random', label: 'Random' },
]

export default function Settings() {
  const navigate = useNavigate()
  const settings = useSettingsStore()
  const lockedTheme = useThemeLock((st) => st.lockedTheme)
  const locked = lockedTheme !== null
  const [confirmClear, setConfirmClear] = useState(false)
  const hapticsAvailable = hapticsSupported()

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/home'))

  const setTheme = (v: string) => {
    if (v === 'dark' || v === 'light' || v === 'system') settings.update({ theme: v })
  }
  const setDifficulty = (v: string) => {
    if (isDifficulty(v)) settings.update({ defaultDifficulty: v })
  }
  const setColor = (v: string) => {
    if (v === 'w' || v === 'b' || v === 'random') settings.update({ defaultColor: v })
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pt-2 pb-8">
      <header className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={goBack} aria-label="Back">
          <ArrowLeft strokeWidth={1.8} aria-hidden="true" />
        </Button>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      </header>

      <Section title="Appearance">
        <div className="flex flex-col gap-3 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">Theme</span>
            <span className="text-xs text-text-secondary">
              The theme picks your opponent: dark is the frog, light is the cat.
            </span>
          </div>
          <ToggleGroup
            type="single"
            value={settings.theme}
            onValueChange={setTheme}
            disabled={locked}
            className="w-full gap-2"
            aria-label="Theme"
          >
            {THEME_ITEMS.map(({ value, label, icon: Icon }) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="flex-1 gap-1.5 rounded-xl border border-border data-[state=on]:border-primary data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
              >
                <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {locked && (
            <div className="flex flex-col gap-2 rounded-xl bg-surface-2 p-3">
              <p className="text-sm text-text-primary">Finish your current battle to change the theme.</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate('/play')}>
                  Resume battle
                </Button>
                <Button size="sm" variant="destructive" className="flex-1" onClick={() => setConfirmClear(true)}>
                  Clear battle
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title="Gameplay">
        <Row
          label="Show hints"
          note="Turn off to hide the Hint card during play."
          control={
            <Switch
              aria-label="Show hints"
              checked={settings.showHints}
              onCheckedChange={(v) => settings.update({ showHints: v })}
            />
          }
        />
        <Row
          label="Highlight last move"
          control={
            <Switch
              aria-label="Highlight last move"
              checked={settings.highlightLastMove}
              onCheckedChange={(v) => settings.update({ highlightLastMove: v })}
            />
          }
        />
        <div className="flex flex-col gap-3 px-4 py-3">
          <span className="text-sm font-medium text-text-primary">Default difficulty</span>
          <ToggleGroup
            type="single"
            value={settings.defaultDifficulty}
            onValueChange={setDifficulty}
            className="w-full gap-2"
            aria-label="Default difficulty"
          >
            {DIFFICULTY_ORDER.map((d) => (
              <ToggleGroupItem
                key={d}
                value={d}
                className="flex-1 rounded-xl border border-border data-[state=on]:border-primary data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
              >
                {DIFFICULTIES[d].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-3 px-4 py-3">
          <span className="text-sm font-medium text-text-primary">Default color</span>
          <ToggleGroup
            type="single"
            value={settings.defaultColor}
            onValueChange={setColor}
            className="w-full gap-2"
            aria-label="Default color"
          >
            {COLOR_ITEMS.map(({ value, label }) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="flex-1 rounded-xl border border-border data-[state=on]:border-primary data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
              >
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </Section>

      <Section title="Sound and haptics">
        <Row
          label="Move sound"
          note="Short tones for moves, captures, check, and results."
          control={
            <Switch
              aria-label="Move sound"
              checked={settings.sound}
              onCheckedChange={(v) => {
                // Turning sound on is a tap, so it also unlocks audio on iPhone.
                if (v) unlockAudio()
                settings.update({ sound: v })
              }}
            />
          }
        />
        <Row
          label="Haptic feedback"
          note={
            hapticsAvailable
              ? 'A short pulse on moves and results.'
              : 'Not available on this device. iPhone and iPad browsers do not support vibration.'
          }
          control={
            <Switch
              aria-label="Haptic feedback"
              checked={settings.haptics && hapticsAvailable}
              disabled={!hapticsAvailable}
              onCheckedChange={(v) => settings.update({ haptics: v })}
            />
          }
        />
      </Section>

      <DataSection />

      <Section title="Help">
        <Link to="/help" className="flex min-h-14 items-center justify-between px-4 py-3 text-sm font-medium text-text-primary">
          Help and support
          <ChevronRight className="size-5 text-text-secondary" strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </Section>

      <Section title="About">
        <Row label="Version" control={<span className="text-sm text-text-secondary">{__APP_VERSION__}</span>} />
        <Link to="/help" className="flex min-h-14 items-center justify-between px-4 py-3 text-sm font-medium text-text-primary">
          Credits and licenses
          <ChevronRight className="size-5 text-text-secondary" strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </Section>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear the current battle?"
        description="The game in progress is deleted. This also unlocks the theme setting."
        confirmLabel="Clear battle"
        destructive
        onConfirm={() => {
          useGameStore.getState().discardBattle()
          toast.success('Battle cleared')
        }}
      />
    </main>
  )
}
