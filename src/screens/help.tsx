import { useState, useRef, type ReactNode } from 'react'
import { ArrowLeft, ChartNoAxesColumnIncreasing, Copy, Crown, Lightbulb, Mail, Check } from 'lucide-react'
import { useNavigate } from 'react-router'
import { LinkedinIcon } from '@/components/layout/linkedin-icon'
import { Button } from '@/components/ui/button'
import { CREDITS } from '@/config/credits'
import { SUPPORT_EMAIL, SUPPORT_LINKEDIN_HANDLE, SUPPORT_LINKEDIN_URL } from '@/config/support'
import { useGameStore } from '@/store/game-store'
import { estimateStorage } from '@/storage/data'

const QUICK_START = [
  {
    icon: Crown,
    title: 'Make a move',
    text: 'Tap a piece, then tap a highlighted square. Undo and Redo step back and forward through your moves.',
  },
  {
    icon: Lightbulb,
    title: 'Use a hint',
    text: 'On your turn, tap Hint to see the engine’s best move. Hints can be turned off in Settings.',
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: 'Read win chance and grades',
    text: 'Win chance is the engine’s estimate of your chances from this position. Every move gets a grade from Best to Blunder.',
  },
]

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What does win chance mean?',
    a: 'It is an estimate from the chess engine of how likely you are to win from the current position. It is not a guarantee.',
  },
  {
    q: 'How are moves graded?',
    a: 'The engine compares your win chance before and after each move. The result is Best, Great, Good, Inaccuracy, Mistake, or Blunder. Accuracy averages those grades.',
  },
  {
    q: 'Why does the opponent sometimes play badly?',
    a: 'Difficulty limits the engine. Easy and Medium make deliberate mistakes, so Hard is the strongest setting.',
  },
  {
    q: 'What happens when I am offline?',
    a: 'After the first load, the engine, your games, and your settings all work without a connection.',
  },
  {
    q: 'How do I install the app?',
    a: 'On Android (Chrome), open the menu and choose Install app or Add to Home screen. On iPhone (Safari), tap Share and then Add to Home Screen.',
  },
  {
    q: 'Where is my data stored?',
    a: 'On this device, in your browser’s local storage. Nothing is sent to a server.',
  },
  {
    q: 'How do I move a game to another device?',
    a: 'In Settings, open Data and choose Export a backup. On the other device, open Settings, Data, and choose Restore a backup. The game in progress is not included.',
  },
  {
    q: 'Why don’t haptics work on iPhone?',
    a: 'iPhone browsers do not support vibration, so the haptic option is marked unavailable there.',
  },
  {
    q: 'What does Hint do?',
    a: 'It highlights the engine’s best move for your current position. It only shows a suggestion. It does not play the move for you.',
  },
  {
    q: 'Why does the Hint card say hints are off?',
    a: 'Show hints is turned off in Settings. Turn it on again there to use the Hint card.',
  },
]

const TROUBLESHOOTING: { title: string; steps: string[] }[] = [
  {
    title: 'The engine will not load',
    steps: [
      'Reload the page while you are online.',
      'Check that your device has free storage. Settings shows how much is used.',
      'If it still fails, close other tabs of ChessMate and reload.',
    ],
  },
  {
    title: 'A game is not resuming',
    steps: [
      'A battle is saved after every move. Open the app and tap Play to continue.',
      'Browsers can delete site data when storage runs low. Export a backup from Settings now and then.',
    ],
  },
  {
    title: 'The app is not updating',
    steps: [
      'Close every ChessMate tab or window, then open the app again.',
      'Reload once while online so the new version downloads.',
    ],
  },
]

/** A titled block on the Help page. */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      {children}
    </section>
  )
}

/** Button with swapped content on copy - shows centered success message */
function CopyButton({
  text,
  children,
  successMessage,
  variant = 'outline',
  disabled = false,
  className,
}: {
  text: string | (() => Promise<string>)
  children: ReactNode
  successMessage: string
  variant?: 'outline' | 'default'
  disabled?: boolean
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const handleCopy = async () => {
    setIsLoading(true)
    try {
      const textToCopy = typeof text === 'function' ? await text() : text
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Capture dimensions on first render of original content
  const handleRef = (el: HTMLButtonElement | null) => {
    buttonRef.current = el
    if (el && !dimensions) {
      const rect = el.getBoundingClientRect()
      setDimensions({ width: rect.width, height: rect.height })
    }
  }

  const variantClasses =
    variant === 'outline'
      ? 'border-2 border-primary bg-transparent text-primary hover:bg-primary/10 hover:text-primary'
      : 'bg-primary text-primary-foreground hover:bg-primary/90'

  const fixedStyles = dimensions ? { minWidth: `${dimensions.width}px`, minHeight: `${dimensions.height}px` } : {}

  return (
    <Button
      ref={handleRef}
      variant={variant}
      size="lg"
      className={`h-auto w-full justify-center gap-3 py-3 transition-all ${variantClasses} ${className || ''}`}
      onClick={handleCopy}
      disabled={disabled || isLoading}
      style={fixedStyles}
    >
      {copied ? (
        <div className="flex items-center justify-center gap-2">
          <Check className="size-5" strokeWidth={2.5} aria-hidden="true" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      ) : (
        children
      )}
    </Button>
  )
}

export default function Help() {
  const navigate = useNavigate()
  const engineStatus = useGameStore((st) => st.engineStatus)

  const getDiagnosticsText = async () => {
    try {
      const est = await estimateStorage()
      return [
        'ChessMate diagnostics',
        `App version: ${__APP_VERSION__}`,
        `Browser: ${navigator.userAgent}`,
        `Online: ${navigator.onLine ? 'yes' : 'no'}`,
        `Engine: ${engineStatus}`,
        `Storage: ${est ? `${est.usageMB} MB used of ${est.quotaMB} MB` : 'not available'}`,
      ].join('\n')
    } catch {
      return 'ChessMate diagnostics\n(Could not load storage info)'
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-8 px-4 pt-2 pb-10">
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/home'))}
          aria-label="Back"
        >
          <ArrowLeft strokeWidth={1.8} aria-hidden="true" />
        </Button>
        <h1 className="text-2xl font-bold text-text-primary">Help and support</h1>
      </header>

      <Block title="Quick start">
        <div className="flex flex-col gap-3">
          {QUICK_START.map(({ icon: Icon, title, text }) => (
            <article key={title} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
                <p className="text-sm text-text-secondary">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </Block>

      <Block title="Questions">
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 text-sm font-medium text-text-primary">
                {q}
                <span aria-hidden="true" className="text-text-secondary transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pt-2 text-sm text-text-secondary">{a}</p>
            </details>
          ))}
        </div>
      </Block>

      <Block title="Troubleshooting">
        <div className="flex flex-col gap-3">
          {TROUBLESHOOTING.map(({ title, steps }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
                {steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Block>

      <Block title="About and credits">
        <p className="text-sm text-text-secondary">ChessMate version {__APP_VERSION__}</p>
        <ul className="flex flex-col gap-2">
          {CREDITS.map((c) => (
            <li key={c.name} className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-text-primary">{c.name}</span>
                <span className="text-xs text-text-secondary">{c.license}</span>
              </div>
              {c.note && <p className="mt-1 text-xs text-text-secondary">{c.note}</p>}
            </li>
          ))}
        </ul>
        <p className="text-xs text-text-secondary">
          Sound effects are generated by the app, so no audio files are shipped.
        </p>
      </Block>

      <Block title="Report a problem">
        <p className="text-sm text-text-secondary">
          Message me directly, and copy the diagnostics into your message. They contain your app version, browser,
          engine status, and storage use. They include no personal data.
        </p>
        <div className="flex flex-col gap-3">
          <CopyButton text={getDiagnosticsText} variant="outline" successMessage="Copied Diagnostics!">
            <Copy className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
            <span className="text-sm font-semibold">Copy diagnostics</span>
          </CopyButton>
          <CopyButton text={SUPPORT_EMAIL} variant="default" successMessage="Copied Email!">
            <Mail className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
            <span className="flex min-w-0 flex-1 flex-col items-start text-left">
              <span className="text-xs font-medium opacity-90">Email</span>
              <span className="block w-full truncate text-sm font-semibold">{SUPPORT_EMAIL}</span>
            </span>
          </CopyButton>
          <Button
            asChild
            size="lg"
            className="h-auto w-full min-w-0 justify-start gap-3 bg-blue py-3 text-primary-foreground hover:bg-blue/90"
          >
            <a href={SUPPORT_LINKEDIN_URL} target="_blank" rel="noreferrer" className="min-w-0">
              <LinkedinIcon className="size-5 shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col items-start text-left">
                <span className="text-xs font-medium opacity-90">LinkedIn</span>
                <span className="block w-full truncate text-sm font-semibold">{SUPPORT_LINKEDIN_HANDLE}</span>
              </span>
            </a>
          </Button>
        </div>
      </Block>
    </main>
  )
}
