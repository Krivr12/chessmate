import { Check, CircleAlert, Star, ThumbsUp, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import type { Grade } from '@/logic/types'

/** Grade color, icon and label (README §5). Never rely on color alone. */
export const GRADE_META: Record<
  Grade,
  { headline: string; label: string; icon: LucideIcon; className: string }
> = {
  best: { headline: 'Best move!', label: 'Best', icon: Star, className: 'bg-mint text-accent-foreground' },
  great: { headline: 'Great move!', label: 'Great', icon: ThumbsUp, className: 'bg-mint/80 text-accent-foreground' },
  good: { headline: 'Nice move!', label: 'Good', icon: Check, className: 'bg-blue text-primary-foreground' },
  inaccuracy: { headline: 'A bit shaky', label: 'Inaccuracy', icon: CircleAlert, className: 'bg-yellow text-[#3a2a05]' },
  mistake: { headline: 'Mistake', label: 'Mistake', icon: X, className: 'border border-coral text-coral' },
  blunder: { headline: 'Blunder!', label: 'Blunder', icon: TriangleAlert, className: 'bg-coral text-destructive-foreground' },
}
