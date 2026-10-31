import { Redo2, RefreshCw, Undo2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ToolbarProps = {
  canUndo: boolean
  canRedo: boolean
  canReset: boolean
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
}

function ToolButton(props: { icon: LucideIcon; label: string; disabled: boolean; onClick: () => void }) {
  const Icon = props.icon
  return (
    <Button
      variant="outline"
      className="flex-1 border-primary/60 bg-card text-primary hover:bg-primary/10 hover:text-primary"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <Icon strokeWidth={1.8} aria-hidden="true" />
      {props.label}
    </Button>
  )
}

export function MoveToolbar(p: ToolbarProps) {
  return (
    <div className="flex gap-2" role="toolbar" aria-label="Move controls">
      <ToolButton icon={Undo2} label="Undo" disabled={!p.canUndo} onClick={p.onUndo} />
      <ToolButton icon={Redo2} label="Redo" disabled={!p.canRedo} onClick={p.onRedo} />
      <ToolButton icon={RefreshCw} label="Reset" disabled={!p.canReset} onClick={p.onReset} />
    </div>
  )
}
