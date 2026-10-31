import { useState } from 'react'
import type { Color } from 'chess.js'
import { Frog } from '@/components/opponent/frog'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DIFFICULTIES, DIFFICULTY_ORDER, isDifficulty } from '@/logic/difficulty'
import { OPPONENTS, opponentForTheme, type OpponentId } from '@/logic/opponents'
import type { Difficulty, Mood } from '@/logic/types'
import { loadDifficulty } from '@/storage/battle-storage'
import { useSettingsStore } from '@/store/settings-store'
import { resolveTheme } from '@/store/theme'
import { BOTTOM_SHEET_CLASS } from './hint-sheet'

const LEVEL_MOOD: Record<Difficulty, Mood> = { easy: 'idle', medium: 'happy', hard: 'think' }
const ITEM_CLASS =
  'h-auto flex-1 flex-col gap-1 rounded-xl border border-border bg-card py-2 data-[state=on]:border-primary data-[state=on]:bg-primary/15 data-[state=on]:text-primary'

type NewGameSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlay: (difficulty: Difficulty, color: Color) => void
  /** Opponent of the battle in progress. Defaults to the one the theme picks. */
  opponent?: OpponentId
}

export function NewGameSheet({ open, onOpenChange, onPlay, opponent }: NewGameSheetProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(loadDifficulty)
  const [color, setColor] = useState<Color>('w')
  const settingsTheme = useSettingsStore((st) => st.theme)
  const opponentId = opponent ?? opponentForTheme(resolveTheme(settingsTheme))
  const oppName = OPPONENTS[opponentId].name

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={BOTTOM_SHEET_CLASS}>
        <SheetHeader className="pt-6">
          <SheetTitle className="text-base">New game</SheetTitle>
          <SheetDescription>Pick how tough the {oppName.toLowerCase()} plays.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <ToggleGroup
            type="single"
            value={difficulty}
            onValueChange={(v) => isDifficulty(v) && setDifficulty(v)}
            className="w-full gap-2"
            aria-label="Difficulty"
          >
            {DIFFICULTY_ORDER.map((d) => (
              <ToggleGroupItem key={d} value={d} className={ITEM_CLASS}>
                <Frog mood={LEVEL_MOOD[d]} className="size-9" />
                <span className="text-sm font-semibold">{DIFFICULTIES[d].label}</span>
                <span className="text-[11px] text-text-secondary">{OPPONENTS[opponentId].difficultyNames[d]}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToggleGroup
            type="single"
            value={color}
            onValueChange={(v) => (v === 'w' || v === 'b') && setColor(v)}
            className="w-full gap-2"
            aria-label="Play as"
          >
            <ToggleGroupItem value="w" className={ITEM_CLASS}>
              <span className="text-sm font-semibold">Play as White</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="b" className={ITEM_CLASS}>
              <span className="text-sm font-semibold">Play as Black</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <SheetFooter className="px-4 pb-6">
          <Button variant="mint" size="lg" onClick={() => onPlay(difficulty, color)}>
            Play
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
