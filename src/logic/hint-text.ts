import { Chess, type Move } from 'chess.js'

const PIECE_NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }

export type HintInfo = { from: Move['from']; to: Move['to']; san: string; reason: string }

/** Turn an engine UCI move (e.g. "g1f3") into SAN plus a short explanation. */
export function describeHint(fen: string, uci: string): HintInfo | null {
  let move: Move
  try {
    move = new Chess(fen).move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4] ?? 'q',
    })
  } catch {
    return null
  }
  return { from: move.from, to: move.to, san: move.san, reason: hintReason(move) }
}

export function hintReason(move: Move): string {
  if (move.san.endsWith('#')) return 'This delivers checkmate'
  if (move.flags.includes('k') || move.flags.includes('q')) {
    return 'This castles your king to safety'
  }
  if (move.promotion) return `This promotes your pawn to a ${PIECE_NAMES[move.promotion]}`
  if (move.captured && move.san.includes('+')) {
    return `This captures a ${PIECE_NAMES[move.captured]} with check`
  }
  if (move.captured) return `This captures a ${PIECE_NAMES[move.captured]}`
  if (move.san.includes('+')) return 'This gives check'
  return 'This improves your position'
}
