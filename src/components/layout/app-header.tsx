import { ArrowLeft, EllipsisVertical, Flag, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type AppHeaderProps = {
  title: string
  canResign: boolean
  onNewGame: () => void
  onResign: () => void
}

export function AppHeader({ title, canResign, onNewGame, onResign }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2">
      <Button asChild variant="ghost" size="icon">
        <Link to="/home" aria-label="Back to home">
          <ArrowLeft strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </Button>
      <h1 className="truncate text-base font-semibold">{title}</h1>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Game menu">
            <EllipsisVertical strokeWidth={1.8} aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onNewGame}>
            <Plus strokeWidth={1.8} aria-hidden="true" />
            New game
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canResign} onSelect={onResign} variant="destructive">
            <Flag strokeWidth={1.8} aria-hidden="true" />
            Resign
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
