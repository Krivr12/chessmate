import type { Grade } from './types'

/** Static line bank (README §12). Keep it playful, never mean. */
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

const lastLine = new Map<TalkCategory, string>()

/** Random line from a category, never the same line twice in a row. */
export function pickLine(category: TalkCategory, random: () => number = Math.random): string {
  const lines = trashTalk[category]
  const options = lines.length > 1 ? lines.filter((l) => l !== lastLine.get(category)) : lines
  const line = options[Math.floor(random() * options.length)] ?? lines[0]
  lastLine.set(category, line)
  return line
}
