/** Third-party software shipped with ChessMate, with each license as stated in the package's own files. */
export type Credit = { name: string; license: string; note?: string }

export const CREDITS: Credit[] = [
  {
    name: 'Stockfish 19',
    license: 'GPL-3.0',
    note: 'Chess engine running in your browser (public/engine). Free software with source available from stockfishchess.org.',
  },
  { name: 'chess.js', license: 'BSD-2-Clause', note: 'Move rules and game state.' },
  {
    name: 'Lichess Puzzle Database',
    license: 'CC0 (Public Domain)',
    note: '1,800+ chess puzzles from database.lichess.org.',
  },
  { name: 'React and React DOM', license: 'MIT' },
  { name: 'React Router', license: 'MIT' },
  { name: 'Zustand', license: 'MIT', note: 'State management.' },
  { name: 'Motion', license: 'MIT', note: 'Animations.' },
  { name: 'Radix UI', license: 'MIT', note: 'Accessible dialogs, switches, and toggles.' },
  { name: 'Lucide', license: 'ISC', note: 'Icons (lucide-react).' },
  { name: 'idb-keyval', license: 'Apache-2.0', note: 'Saved battle storage.' },
  { name: 'idb', license: 'ISC', note: 'History and progress database.' },
  { name: 'Tailwind CSS', license: 'MIT' },
  { name: 'tailwind-merge', license: 'MIT' },
  { name: 'class-variance-authority', license: 'Apache-2.0' },
  { name: 'clsx', license: 'MIT' },
  { name: 'Inter (variable font)', license: 'OFL-1.1', note: 'Typeface, via @fontsource-variable/inter.' },
]
