import type { Square } from 'chess.js'

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

/** Visual column/row (0..7, top-left origin) for a square, given orientation. */
export function toGrid(square: Square, flipped: boolean) {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  return flipped ? { col: 7 - file, row: rank } : { col: file, row: 7 - rank }
}

export function fromGrid(col: number, row: number, flipped: boolean): Square {
  const file = flipped ? 7 - col : col
  const rank = flipped ? row : 7 - row
  return `${FILES[file]}${rank + 1}` as Square
}
