import type { Grade } from './types'

/** Frog word bank (README §12). Keep it playful, never mean. */
export const trashTalk = {
  best: ['Hmph. Lucky guess.', 'Okay, that was annoying.', 'Ribbit... not bad.'],
  great: ["Hm. You've done this before.", "Don't get cocky."],
  good: ['Fine. Acceptable.', 'Keep up, hopper.'],
  inaccuracy: ['Hmm, are you sure about that?', 'A little wobbly there.'],
  mistake: ['Such a beginner move.', "I'll take that, thanks.", 'Oops. Was that on purpose?'],
  blunder: [
    'Ha! Did you mean to do that?',
    "My grandmother plays better. She's a tadpole.",
    'Wow. Just wow.',
  ],
  opponentCaptures: ['Mine now!', 'Gotcha!'],
  playerCaptures: ['Hey! That was mine.', 'Ouch.'],
  playerChecks: ['Eep!', 'Hold on, hold on...'],
  opponentChecks: ['Check!', 'Watch your king.'],
  hintUsed: ['Need a little help? Cute.', 'Peeking, are we?'],
  playerWins: ['You got me. Ribbit...', 'Rematch. Now.'],
  playerLoses: ['You Loss.', 'Ribbit ribbit!'],
  draw: ['A draw? I was just warming up.', "Fine. We'll call it even."],
  gameStart: ['Amaze me! If you can.'],
  resume: ["You're back. Let's finish this."],
} satisfies Record<string, string[]> & Record<Grade, string[]>

export type TalkCategory = keyof typeof trashTalk

/** A word bank: one line list per category. Every opponent has its own. */
export type TrashTalkBank = Record<TalkCategory, string[]>

/** Chicken word bank (plan section 7). Its own voice: playful, never mean, and no frog lines. */
export const chickenTalk: TrashTalkBank = {
  best: ['Bawk... lucky scratch.', "Hmph. Beginner's luck."],
  great: ['Not bad for a hatchling.', "Don't get cocky, chick."],
  good: ['Fine. Acceptable, I suppose.', 'Keep pecking.'],
  inaccuracy: ['Cluck... are you sure about that?', 'Wobbly, wobbly.'],
  mistake: ['That was egg-sactly the wrong move.', 'Oops. On purpose?'],
  blunder: ['Bawk! Did you mean to do that?', "I've seen eggs play better."],
  opponentCaptures: ['Cluck cluck, mine now!', 'Snack time!'],
  playerCaptures: ['Ouch. My feathers.', 'Hey! Hands off my pieces!'],
  playerChecks: ['Eep! Hold on.', 'Bawk! Check?'],
  opponentChecks: ['Cluck! Check!', 'Watch that king, chick.'],
  hintUsed: ['Psst, want a clue? Cute.', 'Peek away, I see you.'],
  playerWins: ['You got me. Bawk...', 'Fair pecks. Rematch?'],
  playerLoses: ['Better luck next time.', 'Cluck cluck!'],
  draw: ["Even? Fine. Next time I'll peck harder.", 'A draw. Bawk.'],
  gameStart: ["Let's see what you've got, chick."],
  resume: ['Back for more? Let us finish this.'],
}

const lastLine = new WeakMap<TrashTalkBank, Map<TalkCategory, string>>()

/** Random line from a category of a bank, never the same line twice in a row. */
export function pickLine(
  category: TalkCategory,
  random: () => number = Math.random,
  bank: TrashTalkBank = trashTalk,
): string {
  const lines = bank[category]
  let last = lastLine.get(bank)
  if (!last) {
    last = new Map()
    lastLine.set(bank, last)
  }
  const options = lines.length > 1 ? lines.filter((l) => l !== last.get(category)) : lines
  const line = options[Math.floor(random() * options.length)] ?? lines[0]
  last.set(category, line)
  return line
}
