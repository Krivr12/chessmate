import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

type PlaceholderProps = {
  title: string
  note?: string
}

/** Stand-in for screens that are built in later milestones. Keeps the route working. */
export function PlaceholderScreen({ title, note = 'Coming soon.' }: PlaceholderProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
      <p className="text-sm text-text-secondary">{note}</p>
      <Button asChild variant="outline">
        <Link to="/play">Play a game</Link>
      </Button>
    </main>
  )
}
