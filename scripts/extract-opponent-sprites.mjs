// One-time extraction of the frog and cat faces from the emote sticker sheet.
// The sheet is RGB with the checkerboard baked into the pixels, so the
// background is removed by flood-filling light, unsaturated pixels from the
// image border. Each face is the largest remaining component in its grid cell.
// Effects next to a face (anger marks, sparkles, ! and ?) are dropped, because
// they are separate components. If a face comes out too small (a gap in its
// outline let the background flood in), the cell is redone with the outline
// gaps sealed first.
// Run: node scripts/extract-opponent-sprites.mjs
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const SRC = 'public/icons/Kawaii Frog and Cat Emote Sticker Sheet.png'
const OUT_DIR = 'public/opponents'

// Grid layout of the sheet (1536 x 1024). Rows are [y0, y1), columns are [x0, x1).
const COLUMNS = [
  [0, 420],
  [420, 740],
  [740, 1040],
]
const ROWS = [
  { animal: 'frog', y: [0, 250], moods: ['happy', 'sad', 'shock'] },
  { animal: 'frog', y: [250, 500], moods: ['angry', 'idle', 'think'] },
  { animal: 'cat', y: [500, 760], moods: ['happy', 'sad', 'shock'] },
  { animal: 'cat', y: [760, 1024], moods: ['angry', 'idle', 'think'] },
]
const MIN_FACE_PIXELS = 4000
// A face below this size is treated as broken (background leaked into it).
const RELIABLE_FACE_PIXELS = 30000
// Effects near a face are kept if they are at least this many pixels.
const MIN_EFFECT_PIXELS = 30
// Anything larger is another face, not an effect. Faces are about 38,000 px or more.
const MAX_EFFECT_PIXELS = 15000
// How far (px) an effect's bounding box may sit from the face's bounding box.
const EFFECT_MARGIN = 40
// Components starting at or beyond this x are the grouped effects column on the right.
const RIGHT_COLUMN_X = 1080
const SEAL_RADIUS = 3
const PAD = 6

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width
const H = info.height

// Square-window max (dilate) or min (erode) filter, applied per row and then per column.
function morph(src, r, takeMax) {
  const tmp = new Uint8Array(W * H)
  const out = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = takeMax ? 0 : 1
      for (let dx = -r; dx <= r; dx++) {
        const xx = x + dx
        const s = xx < 0 || xx >= W ? (takeMax ? 0 : 1) : src[y * W + xx]
        v = takeMax ? Math.max(v, s) : Math.min(v, s)
      }
      tmp[y * W + x] = v
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = takeMax ? 0 : 1
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy
        const s = yy < 0 || yy >= H ? (takeMax ? 0 : 1) : tmp[yy * W + x]
        v = takeMax ? Math.max(v, s) : Math.min(v, s)
      }
      out[y * W + x] = v
    }
  }
  return out
}

// Light, unsaturated pixels: the checkerboard background.
const candidate = new Uint8Array(W * H)
for (let i = 0; i < W * H; i++) {
  const r = data[i * 3]
  const g = data[i * 3 + 1]
  const b = data[i * 3 + 2]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  candidate[i] = min >= 150 && max - min <= 28 ? 1 : 0
}

// Closing of the foreground (not-background) mask: dilate, then erode.
// Returns 1 for foreground pixels after the closing.
const sealedForeground = morph(
  morph(
    candidate.map((v) => (v ? 0 : 1)),
    SEAL_RADIUS,
    true,
  ),
  SEAL_RADIUS,
  false,
)

// Flood fill the background from the image border, then label the remaining
// (non-background) pixels into 4-connected components.
function segment(blockedMask) {
  const bg = new Uint8Array(W * H)
  const stack = []
  const seed = (i) => {
    if (candidate[i] && !blockedMask[i] && !bg[i]) {
      bg[i] = 1
      stack.push(i)
    }
  }
  for (let x = 0; x < W; x++) {
    seed(x)
    seed((H - 1) * W + x)
  }
  for (let y = 0; y < H; y++) {
    seed(y * W)
    seed(y * W + W - 1)
  }
  while (stack.length) {
    const i = stack.pop()
    const x = i % W
    const y = (i - x) / W
    if (x > 0) seed(i - 1)
    if (x < W - 1) seed(i + 1)
    if (y > 0) seed(i - W)
    if (y < H - 1) seed(i + W)
  }

  const label = new Int32Array(W * H).fill(-1)
  const components = []
  for (let start = 0; start < W * H; start++) {
    if (bg[start] || label[start] !== -1) continue
    const id = components.length
    const comp = { id, size: 0, sumX: 0, sumY: 0, minX: W, maxX: 0, minY: H, maxY: 0 }
    const queue = [start]
    label[start] = id
    while (queue.length) {
      const i = queue.pop()
      const x = i % W
      const y = (i - x) / W
      comp.size++
      comp.sumX += x
      comp.sumY += y
      comp.minX = Math.min(comp.minX, x)
      comp.maxX = Math.max(comp.maxX, x)
      comp.minY = Math.min(comp.minY, y)
      comp.maxY = Math.max(comp.maxY, y)
      const neighbours = []
      if (x > 0) neighbours.push(i - 1)
      if (x < W - 1) neighbours.push(i + 1)
      if (y > 0) neighbours.push(i - W)
      if (y < H - 1) neighbours.push(i + W)
      for (const n of neighbours) {
        if (!bg[n] && label[n] === -1) {
          label[n] = id
          queue.push(n)
        }
      }
    }
    components.push(comp)
  }
  return { label, components }
}

// True if the component's centroid lies inside the cell.
function inCell(comp, [x0, x1], [y0, y1]) {
  const cx = comp.sumX / comp.size
  const cy = comp.sumY / comp.size
  return cx >= x0 && cx < x1 && cy >= y0 && cy < y1
}

// Largest component whose centroid lies in the cell.
function pickFace(components, [x0, x1], [y0, y1]) {
  let best = null
  for (const comp of components) {
    if (!inCell(comp, [x0, x1], [y0, y1])) continue
    if (comp.size < MIN_FACE_PIXELS) continue
    if (!best || comp.size > best.size) best = comp
  }
  return best
}

const plain = segment(new Uint8Array(W * H))
const sealed = segment(sealedForeground)

await mkdir(OUT_DIR, { recursive: true })

for (const row of ROWS) {
  for (let c = 0; c < COLUMNS.length; c++) {
    const mood = row.moods[c]
    const col = c
    const file = path.join(OUT_DIR, `${row.animal}-${mood}.webp`)

    let seg = plain
    let best = pickFace(plain.components, COLUMNS[c], row.y)
    if (!best || best.size < RELIABLE_FACE_PIXELS) {
      const fallback = pickFace(sealed.components, COLUMNS[c], row.y)
      if (fallback && (!best || fallback.size > best.size)) {
        seg = sealed
        best = fallback
      }
    }
    if (!best) throw new Error(`No face found for ${row.animal}-${mood}`)

    // Keep the face plus any effect (anger mark, sparkle, !, ?, sweat drop) whose
    // bounding box is near the face. The grouped effects column on the far right
    // starts at RIGHT_COLUMN_X and is never included.
    const members = new Set([
      best.id,
      ...seg.components
        .filter(
          (c) =>
            c.minX < RIGHT_COLUMN_X &&
            inCell(c, COLUMNS[col], row.y) &&
            c.size >= MIN_EFFECT_PIXELS &&
            c.size <= MAX_EFFECT_PIXELS &&
            c.maxX >= best.minX - EFFECT_MARGIN &&
            c.minX <= best.maxX + EFFECT_MARGIN &&
            c.maxY >= best.minY - EFFECT_MARGIN &&
            c.minY <= best.maxY + EFFECT_MARGIN,
        )
        .map((c) => c.id),
    ])
    const box = seg.components
      .filter((c) => members.has(c.id))
      .reduce(
        (b, c) => ({
          minX: Math.min(b.minX, c.minX),
          maxX: Math.max(b.maxX, c.maxX),
          minY: Math.min(b.minY, c.minY),
          maxY: Math.max(b.maxY, c.maxY),
        }),
        { minX: W, maxX: 0, minY: H, maxY: 0 },
      )

    // Crop to the combined bounding box; pixels outside the kept components become transparent.
    const left = Math.max(0, box.minX - PAD)
    const top = Math.max(0, box.minY - PAD)
    const width = Math.min(W, box.maxX + PAD + 1) - left
    const height = Math.min(H, box.maxY + PAD + 1) - top
    const rgba = Buffer.alloc(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const src = (top + y) * W + (left + x)
        const dst = (y * width + x) * 4
        rgba[dst] = data[src * 3]
        rgba[dst + 1] = data[src * 3 + 1]
        rgba[dst + 2] = data[src * 3 + 2]
        rgba[dst + 3] = members.has(seg.label[src]) ? 255 : 0
      }
    }

    await sharp(rgba, { raw: { width, height, channels: 4 } })
      .webp({ quality: 92, alphaQuality: 100 })
      .toFile(file)
    console.log(`${file}  ${width}x${height}  (face ${best.size}px, sealed=${seg === sealed})`)
  }
}
