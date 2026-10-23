// Generates PWA PNG icons from an inline SVG (knight on navy). Run: npm run icons
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const KNIGHT = `
  <path d="M30 86C30 74 36 68 40 62C34 62 24 60 18 54C14 50 14 46 18 42L32 28L36 12L46 22C52 20 58 22 64 28C74 38 78 56 74 86Z" fill="#9fd4ff"/>
  <rect x="22" y="84" width="60" height="10" rx="4" fill="#9fd4ff"/>
  <circle cx="41" cy="35" r="3.2" fill="#061824"/>`

/** `scale` shrinks the knight so maskable icons keep it inside the safe zone. */
const svg = (scale, radius) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="${radius}" fill="#061824"/>
  <g transform="translate(${50 - 52 * scale} ${50 - 53 * scale}) scale(${scale})">${KNIGHT}</g>
</svg>`

const out = 'public/icons'
await mkdir(out, { recursive: true })
const jobs = [
  ['icon-192.png', 192, svg(0.78, 0)],
  ['icon-512.png', 512, svg(0.78, 0)],
  ['maskable-512.png', 512, svg(0.6, 0)],
  ['apple-touch-icon.png', 180, svg(0.72, 0)],
]
for (const [name, size, src] of jobs) {
  await sharp(Buffer.from(src)).resize(size, size).png().toFile(`${out}/${name}`)
  console.log('wrote', `${out}/${name}`)
}
