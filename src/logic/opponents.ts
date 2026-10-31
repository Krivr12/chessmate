import { catTalk, trashTalk, type TrashTalkBank } from './trash-talk'

export type OpponentId = 'frog' | 'cat'

export type Opponent = {
  id: OpponentId
  /** Name shown in headers, copy, and aria labels. */
  name: string
  /** This opponent's own word bank (D2). */
  lines: TrashTalkBank
}

export const OPPONENTS: Record<OpponentId, Opponent> = {
  frog: {
    id: 'frog',
    name: 'Frog',
    lines: trashTalk,
  },
  cat: {
    id: 'cat',
    name: 'Cat',
    lines: catTalk,
  },
}

/** The theme decides the animal: dark = frog, light = cat (D1). */
export const opponentForTheme = (resolved: 'dark' | 'light'): OpponentId =>
  resolved === 'dark' ? 'frog' : 'cat'

/**
 * Saved battles from before the rename store `chicken`, which now means the cat.
 * Old MVP saves have no opponent field, so they resume as the frog.
 */
export const opponentOrDefault = (id: unknown): OpponentId =>
  id === 'cat' || id === 'chicken' ? 'cat' : 'frog'
