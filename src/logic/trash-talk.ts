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
  puzzleCorrect: ['Nice move, keep going.', 'Hmph. Keep it up.'],
  puzzleWrong: ['Ribbit... that is not it.', 'Oops. Look again.'],
  puzzleSolved: ['Fine. You solved it.', 'Ribbit! Next one?'],
} satisfies Record<string, string[]> & Record<Grade, string[]>

export type TalkCategory = keyof typeof trashTalk

/** A word bank: one line list per category. Every opponent has its own. */
export type TrashTalkBank = Record<TalkCategory, string[]>

/** Cat word bank. Its own voice: playful, never mean, and no frog lines. */
export const catTalk: TrashTalkBank = {
  best: ['Mrow. Lucky paw.', "Hmph. Beginner's luck.", 'Purr... not bad at all.'],
  great: ['Not bad for a kitten.', "Don't get too smug about it.", 'Mew! You surprised me.'],
  good: ['Fine. Acceptable, I suppose.', "Meow. That'll do.", 'Not terrible, really.'],
  inaccuracy: ['Mrrp... are you sure about that?', 'Wobbly paws there.', 'That was a bit sketchy.'],
  mistake: ['That was a hairball of a move.', 'Oops. On purpose?', "I've seen better from kittens."],
  blunder: ['Mrrow! Did you mean to do that?', "I've seen better in a yarn ball.", 'Wow. That hurt to watch.'],
  opponentCaptures: ['Mine now, purr!', 'Snack time!', 'Yummy!'],
  playerCaptures: ['Hey! Hands off my pieces!', 'Hiss! That was mine.', 'Ouch, that stung.'],
  playerChecks: ['Eep! Hold on.', 'Mrrow! Check?', 'Meow! Careful now.'],
  opponentChecks: ['Mrrow! Check!', 'Watch that king, friend.', 'Your move. Better be good.'],
  hintUsed: ['Psst, want a clue? Cute.', 'Peeking again? I see you.', 'Asking for help? How precious.'],
  playerWins: ['You got me. Purr...', 'Fair play. Rematch?', 'Well played. I yield.'],
  playerLoses: ['Better luck next time.', 'Purr purr!', 'Meow. Victory!'],
  draw: ["Even? Fine. Next time I'll pounce harder.", 'A draw. Mrrp.', "It's a tie. For this round."],
  gameStart: ["Let's see what you've got, friend.", 'Time to show your moves.'],
  resume: ['Back for more? Let us finish this.', "Let's complete what we started."],
  puzzleCorrect: ['Purr! Keep going.', 'Ooh, nice one.', 'Meow! Spot on.'],
  puzzleWrong: ['Mrrp... not that one.', 'Oops, wrong branch!', 'Try a different path, friend.'],
  puzzleSolved: ['Purr! You solved it!', 'Purr-fect. Next?', 'Meow! Nicely done.'],
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
