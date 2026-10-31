// TEMPORARY dev-only preview of the win / loss / draw result screens.
// Delete this file and its route in App.tsx when done.
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { ResultScreen } from '@/components/result/result-screen'
import { Button } from '@/components/ui/button'
import type { MoveRecord, Outcome } from '@/logic/types'

const SAMPLE_MOVES: MoveRecord[] = [
  { from: 'e2', to: 'e4', san: 'e4', by: 'player', winBefore: 50, winAfter: 54, grade: 'best' },
  { from: 'e7', to: 'e5', san: 'e5', by: 'opponent' },
  { from: 'g1', to: 'f3', san: 'Nf3', by: 'player', winBefore: 54, winAfter: 56, grade: 'great' },
  { from: 'b8', to: 'c6', san: 'Nc6', by: 'opponent' },
  { from: 'f1', to: 'c4', san: 'Bc4', by: 'player', winBefore: 56, winAfter: 49, grade: 'mistake' },
  { from: 'g8', to: 'f6', san: 'Nf6', by: 'opponent' },
  { from: 'd2', to: 'd3', san: 'd3', by: 'player', winBefore: 49, winAfter: 47, grade: 'good' },
  { from: 'f8', to: 'c5', san: 'Bc5', by: 'opponent' },
]

const OUTCOMES: Record<string, Outcome> = {
  win: { result: 'win', reason: 'Checkmate' },
  loss: { result: 'loss', reason: 'Checkmate' },
  draw: { result: 'draw', reason: 'Stalemate' },
}

const LINKS = [
  { to: '/preview/result/win', label: 'Win' },
  { to: '/preview/result/loss', label: 'Loss' },
  { to: '/preview/result/draw', label: 'Draw' },
]

export default function ResultPreview() {
  const { outcome: key } = useParams()
  const navigate = useNavigate()
  const outcome = key ? OUTCOMES[key] : undefined

  if (!outcome) return <Navigate to="/preview/result/win" replace />

  return (
    <>
      <nav className="fixed top-2 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-app-bg/90 p-1 shadow-md backdrop-blur">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            replace
            className={
              l.to.endsWith(key ?? '')
                ? 'rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground'
                : 'rounded-full px-3 py-1 text-xs font-semibold text-text-secondary hover:bg-muted'
            }
          >
            {l.label}
          </Link>
        ))}
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          Home
        </Button>
      </nav>
      <ResultScreen
        key={key}
        outcome={outcome}
        opponent="frog"
        moves={SAMPLE_MOVES}
        onPlayAgain={() => navigate(`/preview/result/${key}`, { replace: true })}
        onHome={() => navigate('/')}
      />
    </>
  )
}
